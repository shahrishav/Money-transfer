const { getPool, sql } = require('../config/database');

const getReceivers = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM receivers WHERE user_id = @user_id AND is_active = 1');
    res.json({ receivers: result.recordset });
  } catch (err) {
    console.error('❌ getReceivers error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getReceiverById = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid receiver ID' });
  }

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM receivers WHERE id = @id AND user_id = @user_id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    res.json({ receiver: result.recordset[0] });
  } catch (err) {
    console.error('❌ getReceiverById error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const createReceiver = async (req, res) => {
  const {
    full_name, phone, bank_name, bank_account,
    address, state, district, municipality,
    ward_number, date_of_birth, id_number,
    id_issue_date, father_spouse_name
  } = req.body;

  if (!full_name || !phone || !bank_name || !bank_account ||
      !address || !state || !district || !municipality ||
      !ward_number || !date_of_birth || !id_number ||
      !id_issue_date || !father_spouse_name) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const pool = getPool();
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('full_name', sql.NVarChar, full_name)
      .input('phone', sql.NVarChar, phone)
      .input('bank_name', sql.NVarChar, bank_name)
      .input('bank_account', sql.NVarChar, bank_account)
      .input('address', sql.NVarChar, address)
      .input('state', sql.NVarChar, state)
      .input('district', sql.NVarChar, district)
      .input('municipality', sql.NVarChar, municipality)
      .input('ward_number', sql.NVarChar, ward_number)
      .input('date_of_birth', sql.Date, new Date(date_of_birth))
      .input('id_number', sql.NVarChar, id_number)
      .input('id_issue_date', sql.Date, new Date(id_issue_date))
      .input('father_spouse_name', sql.NVarChar, father_spouse_name)
      .query(`
        INSERT INTO receivers 
          (user_id, full_name, phone, bank_name, bank_account, address, 
           state, district, municipality, ward_number, date_of_birth, 
           id_number, id_issue_date, father_spouse_name)
        VALUES 
          (@user_id, @full_name, @phone, @bank_name, @bank_account, @address,
           @state, @district, @municipality, @ward_number, @date_of_birth,
           @id_number, @id_issue_date, @father_spouse_name)
      `);
    res.status(201).json({ message: 'Receiver created successfully' });
  } catch (err) {
    console.error('❌ createReceiver error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateReceiver = async (req, res) => {
  const {
    full_name, phone, bank_name, bank_account,
    address, state, district, municipality,
    ward_number, date_of_birth, id_number,
    id_issue_date, father_spouse_name
  } = req.body;

  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .input('full_name', sql.NVarChar, full_name)
      .input('phone', sql.NVarChar, phone)
      .input('bank_name', sql.NVarChar, bank_name)
      .input('bank_account', sql.NVarChar, bank_account)
      .input('address', sql.NVarChar, address)
      .input('state', sql.NVarChar, state)
      .input('district', sql.NVarChar, district)
      .input('municipality', sql.NVarChar, municipality)
      .input('ward_number', sql.NVarChar, ward_number)
      .input('date_of_birth', sql.Date, new Date(date_of_birth))
      .input('id_number', sql.NVarChar, id_number)
      .input('id_issue_date', sql.Date, new Date(id_issue_date))
      .input('father_spouse_name', sql.NVarChar, father_spouse_name)
      .query(`
        UPDATE receivers SET
          full_name = @full_name, phone = @phone,
          bank_name = @bank_name, bank_account = @bank_account,
          address = @address, state = @state, district = @district,
          municipality = @municipality, ward_number = @ward_number,
          date_of_birth = @date_of_birth, id_number = @id_number,
          id_issue_date = @id_issue_date,
          father_spouse_name = @father_spouse_name,
          updated_at = GETDATE()
        WHERE id = @id AND user_id = @user_id
      `);
    res.json({ message: 'Receiver updated successfully' });
  } catch (err) {
    console.error('❌ updateReceiver error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteReceiver = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('UPDATE receivers SET is_active = 0 WHERE id = @id AND user_id = @user_id');
    res.json({ message: 'Receiver deleted successfully' });
  } catch (err) {
    console.error('❌ deleteReceiver error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getReceivers, getReceiverById, createReceiver, updateReceiver, deleteReceiver };