const { getPool, sql } = require('../config/database');

const calculateServiceFee = (amount_npr) => {
  if (amount_npr <= 100000) return 500;
  if (amount_npr <= 200000) return 1000;
  return 3000;
};

const generatePIN = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// ─── CALCULATE FEE ───────────────────────────────────────────
const calculateFee = async (req, res) => {
  const { amount_jpy } = req.body;

  if (!amount_jpy || amount_jpy <= 0) {
    return res.status(400).json({ message: 'Valid JPY amount required' });
  }

  const forex_rate = 0.92;
  const amount_npr = parseFloat((amount_jpy * forex_rate).toFixed(2));
  const service_fee = calculateServiceFee(amount_npr);
  const total_amount = parseFloat((amount_npr + service_fee).toFixed(2));

  res.json({
    amount_jpy: parseFloat(amount_jpy),
    forex_rate,
    amount_npr,
    service_fee,
    total_amount,
    fee_breakdown: {
      rule: amount_npr <= 100000
        ? 'NPR 0 - 100,000 → fee NPR 500'
        : amount_npr <= 200000
        ? 'NPR 100,001 - 200,000 → fee NPR 1,000'
        : 'Above NPR 200,000 → fee NPR 3,000'
    }
  });
};

// ─── SEND MONEY ──────────────────────────────────────────────
const sendMoney = async (req, res) => {
  const { sender_id, receiver_id, amount_jpy } = req.body;

  if (!sender_id || !receiver_id || !amount_jpy) {
    return res.status(400).json({ message: 'sender_id, receiver_id and amount_jpy are required' });
  }

  if (amount_jpy <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  try {
    const pool = getPool();

    const senderCheck = await pool.request()
      .input('id', sql.Int, sender_id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM senders WHERE id = @id AND user_id = @user_id AND is_active = 1');

    if (senderCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const receiverCheck = await pool.request()
      .input('id', sql.Int, receiver_id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM receivers WHERE id = @id AND user_id = @user_id AND is_active = 1');

    if (receiverCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const forex_rate = 0.92;
    const amount_npr = parseFloat((amount_jpy * forex_rate).toFixed(2));
    const service_fee = calculateServiceFee(amount_npr);
    const total_amount = parseFloat((amount_npr + service_fee).toFixed(2));

    // Generate unique 10-digit PIN
    let pin_code;
    let pinExists = true;
    while (pinExists) {
      pin_code = generatePIN();
      const pinCheck = await pool.request()
        .input('pin_code', sql.NVarChar, pin_code)
        .query('SELECT id FROM transactions WHERE pin_code = @pin_code');
      pinExists = pinCheck.recordset.length > 0;
    }

    const result = await pool.request()
      .input('sender_id', sql.Int, sender_id)
      .input('receiver_id', sql.Int, receiver_id)
      .input('user_id', sql.Int, req.user.id)
      .input('amount_jpy', sql.Decimal(18, 2), parseFloat(amount_jpy))
      .input('forex_rate', sql.Decimal(10, 4), forex_rate)
      .input('amount_npr', sql.Decimal(18, 2), amount_npr)
      .input('service_fee', sql.Decimal(10, 2), service_fee)
      .input('total_amount', sql.Decimal(18, 2), total_amount)
      .input('pin_code', sql.NVarChar, pin_code)
      .query(`
        INSERT INTO transactions
          (sender_id, receiver_id, user_id, amount_jpy, forex_rate,
           amount_npr, service_fee, total_amount, status, pin_code)
        OUTPUT INSERTED.id, INSERTED.created_at
        VALUES
          (@sender_id, @receiver_id, @user_id, @amount_jpy, @forex_rate,
           @amount_npr, @service_fee, @total_amount, 'pending', @pin_code)
      `);

    const transaction = result.recordset[0];
    const sender = senderCheck.recordset[0];
    const receiver = receiverCheck.recordset[0];

    console.log('✅ Money sent. PIN:', pin_code);

    res.status(201).json({
      message: 'Money sent successfully',
      pin_code,
      pin_message: 'Share this 10-digit PIN with the receiver to claim the money',
      transaction: {
        id: transaction.id,
        amount_jpy: parseFloat(amount_jpy),
        forex_rate,
        amount_npr,
        service_fee,
        total_amount,
        status: 'pending',
        created_at: transaction.created_at,
      },
      sender: {
        full_name: sender.full_name,
        phone: sender.phone,
        address: sender.address,
        district: sender.district,
        state: sender.state,
      },
      receiver: {
        full_name: receiver.full_name,
        bank_name: receiver.bank_name,
        bank_account: receiver.bank_account,
      },
    });

  } catch (err) {
    console.error('❌ sendMoney error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── LOOKUP BY PIN ───────────────────────────────────────────
const lookupPIN = async (req, res) => {
  const { pin_code } = req.body;

  if (!pin_code || pin_code.length !== 10) {
    return res.status(400).json({ message: 'Valid 10-digit PIN is required' });
  }

  try {
    const pool = getPool();

    const result = await pool.request()
      .input('pin_code', sql.NVarChar, pin_code)
      .query(`
        SELECT
          t.id, t.amount_jpy, t.forex_rate, t.amount_npr,
          t.service_fee, t.total_amount, t.status, t.pin_used,
          t.created_at,
          s.full_name AS sender_name,
          s.phone     AS sender_phone,
          s.address   AS sender_address,
          s.district  AS sender_district,
          s.state     AS sender_state,
          r.full_name   AS receiver_name,
          r.bank_name,
          r.bank_account
        FROM transactions t
        JOIN senders   s ON t.sender_id   = s.id
        JOIN receivers r ON t.receiver_id = r.id
        WHERE t.pin_code = @pin_code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Invalid PIN. No transaction found.' });
    }

    const tx = result.recordset[0];

    if (tx.pin_used) {
      return res.status(400).json({ message: 'This PIN has already been used.' });
    }

    if (tx.status === 'completed' || tx.status === 'paid') {
      return res.status(400).json({ message: 'This transaction has already been completed.' });
    }

    res.json({
      message: 'Transaction found. Please fill in receiver details to claim money.',
      transaction: {
        id: tx.id,
        amount_npr: tx.amount_npr,
        service_fee: tx.service_fee,
        total_amount: tx.total_amount,
        created_at: tx.created_at,
      },
      sender: {
        full_name: tx.sender_name,
        phone: tx.sender_phone,
        address: tx.sender_address,
        district: tx.sender_district,
        state: tx.sender_state,
      },
      receiver_name: tx.receiver_name,
      bank_name: tx.bank_name,
      bank_account: tx.bank_account,
    });

  } catch (err) {
    console.error('❌ lookupPIN error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── RECEIVE MONEY ───────────────────────────────────────────
const receiveMoney = async (req, res) => {
  const {
    pin_code, full_name, phone, bank_name, bank_account,
    address, state, district, municipality, ward_number,
    date_of_birth, id_number, id_issue_date, father_spouse_name
  } = req.body;

  if (!pin_code || pin_code.length !== 10) {
    return res.status(400).json({ message: 'Valid 10-digit PIN is required' });
  }

  if (!full_name || !phone || !bank_name || !bank_account ||
      !address || !state || !district || !municipality ||
      !ward_number || !date_of_birth || !id_number ||
      !id_issue_date || !father_spouse_name) {
    return res.status(400).json({ message: 'All receiver details are required' });
  }

  try {
    const pool = getPool();

    const txResult = await pool.request()
      .input('pin_code', sql.NVarChar, pin_code)
      .query(`
        SELECT t.*, r.full_name AS expected_receiver_name
        FROM transactions t
        JOIN receivers r ON t.receiver_id = r.id
        WHERE t.pin_code = @pin_code
          AND t.pin_used = 0
          AND t.status = 'pending'
      `);

    if (txResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Invalid PIN or transaction already completed.'
      });
    }

    const tx = txResult.recordset[0];

    // Save receiver claim details
    await pool.request()
      .input('transaction_id', sql.Int, tx.id)
      .input('full_name', sql.NVarChar, full_name.trim())
      .input('phone', sql.NVarChar, phone)
      .input('bank_name', sql.NVarChar, bank_name)
      .input('bank_account', sql.NVarChar, bank_account)
      .input('address', sql.NVarChar, address.trim())
      .input('state', sql.NVarChar, state)
      .input('district', sql.NVarChar, district)
      .input('municipality', sql.NVarChar, municipality)
      .input('ward_number', sql.NVarChar, ward_number.toString())
      .input('date_of_birth', sql.Date, new Date(date_of_birth))
      .input('id_number', sql.NVarChar, id_number.trim().toUpperCase())
      .input('id_issue_date', sql.Date, new Date(id_issue_date))
      .input('father_spouse_name', sql.NVarChar, father_spouse_name.trim())
      .query(`
        INSERT INTO receiver_claims
          (transaction_id, full_name, phone, bank_name, bank_account,
           address, state, district, municipality, ward_number,
           date_of_birth, id_number, id_issue_date, father_spouse_name)
        VALUES
          (@transaction_id, @full_name, @phone, @bank_name, @bank_account,
           @address, @state, @district, @municipality, @ward_number,
           @date_of_birth, @id_number, @id_issue_date, @father_spouse_name)
      `);

    // Mark transaction as completed
    await pool.request()
      .input('id', sql.Int, tx.id)
      .query(`
        UPDATE transactions
        SET status = 'completed', pin_used = 1
        WHERE id = @id
      `);

    console.log('✅ Money received for transaction:', tx.id);

    res.json({
      message: 'Money received successfully',
      receipt: {
        transaction_id: tx.id,
        amount_npr: tx.amount_npr,
        service_fee: tx.service_fee,
        total_amount: tx.total_amount,
        receiver_name: full_name,
        bank_name,
        bank_account,
        completed_at: new Date(),
      },
    });

  } catch (err) {
    console.error('❌ receiveMoney error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── MARK AS PAID ────────────────────────────────────────────
const markAsPaid = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getPool();

    const check = await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM transactions WHERE id = @id AND user_id = @user_id');

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (check.recordset[0].status === 'paid') {
      return res.status(400).json({ message: 'Transaction already marked as paid' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE transactions
        SET status = 'paid', paid_at = GETDATE()
        WHERE id = @id
      `);

    console.log('✅ Transaction marked as paid:', id);

    res.json({ message: 'Transaction marked as paid successfully' });

  } catch (err) {
    console.error('❌ markAsPaid error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET ALL TRANSACTIONS ────────────────────────────────────
const getTransactions = async (req, res) => {
  const { start_date, end_date, sender_id, receiver_id, status } = req.query;

  try {
    const pool = getPool();

    let query = `
      SELECT
        t.id, t.amount_jpy, t.forex_rate, t.amount_npr,
        t.service_fee, t.total_amount, t.status, t.pin_used,
        t.created_at, t.paid_at,
        s.full_name AS sender_name,
        s.phone     AS sender_phone,
        r.full_name   AS receiver_name,
        r.bank_name,
        r.bank_account
      FROM transactions t
      JOIN senders   s ON t.sender_id   = s.id
      JOIN receivers r ON t.receiver_id = r.id
      WHERE t.user_id = @user_id
    `;

    const request = pool.request()
      .input('user_id', sql.Int, req.user.id);

    if (start_date) {
      query += ' AND t.created_at >= @start_date';
      request.input('start_date', sql.DateTime, new Date(start_date));
    }
    if (end_date) {
      query += ' AND t.created_at <= @end_date';
      request.input('end_date', sql.DateTime, new Date(end_date));
    }
    if (sender_id) {
      query += ' AND t.sender_id = @sender_id';
      request.input('sender_id', sql.Int, sender_id);
    }
    if (receiver_id) {
      query += ' AND t.receiver_id = @receiver_id';
      request.input('receiver_id', sql.Int, receiver_id);
    }
    if (status) {
      query += ' AND t.status = @status';
      request.input('status', sql.NVarChar, status);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await request.query(query);

    const total_transactions = result.recordset.length;
    const total_jpy  = result.recordset.reduce((sum, t) => sum + parseFloat(t.amount_jpy), 0);
    const total_npr  = result.recordset.reduce((sum, t) => sum + parseFloat(t.amount_npr), 0);
    const total_fees = result.recordset.reduce((sum, t) => sum + parseFloat(t.service_fee), 0);
    const completed  = result.recordset.filter(t => t.status === 'completed').length;
    const pending    = result.recordset.filter(t => t.status === 'pending').length;
    const paid       = result.recordset.filter(t => t.status === 'paid').length;

    res.json({
      summary: {
        total_transactions,
        completed,
        pending,
        paid,
        total_jpy:  parseFloat(total_jpy.toFixed(2)),
        total_npr:  parseFloat(total_npr.toFixed(2)),
        total_fees: parseFloat(total_fees.toFixed(2)),
      },
      transactions: result.recordset,
    });

  } catch (err) {
    console.error('❌ getTransactions error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  sendMoney, receiveMoney, lookupPIN,
  getTransactions, calculateFee, markAsPaid,
};