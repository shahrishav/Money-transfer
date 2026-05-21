const { getPool, sql } = require('../config/database');

const getSenders = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM senders WHERE user_id = @user_id AND is_active = 1');
    res.json({ senders: result.recordset });
  } catch (err) {
    console.error('❌ getSenders error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getSenderById = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT * FROM senders WHERE id = @id AND user_id = @user_id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    res.json({ sender: result.recordset[0] });
  } catch (err) {
    console.error('❌ getSenderById error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createSender = async (req, res) => {
  const {
    full_name, phone, address, state, district,
    municipality, ward_number, date_of_birth,
    id_number, id_issue_date, father_spouse_name
  } = req.body;

  if (!full_name || !phone || !address || !state || !district ||
      !municipality || !ward_number || !date_of_birth ||
      !id_number || !id_issue_date || !father_spouse_name) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const pool = getPool();
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('full_name', sql.NVarChar, full_name)
      .input('phone', sql.NVarChar, phone)
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
        INSERT INTO senders 
          (user_id, full_name, phone, address, state, district, 
           municipality, ward_number, date_of_birth, id_number, 
           id_issue_date, father_spouse_name)
        VALUES 
          (@user_id, @full_name, @phone, @address, @state, @district,
           @municipality, @ward_number, @date_of_birth, @id_number,
           @id_issue_date, @father_spouse_name)
      `);
    res.status(201).json({ message: 'Sender created successfully' });
  } catch (err) {
    console.error('❌ createSender error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateSender = async (req, res) => {
  const {
    full_name, phone, address, state, district,
    municipality, ward_number, date_of_birth,
    id_number, id_issue_date, father_spouse_name
  } = req.body;

  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .input('full_name', sql.NVarChar, full_name)
      .input('phone', sql.NVarChar, phone)
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
        UPDATE senders SET
          full_name = @full_name, phone = @phone, address = @address,
          state = @state, district = @district, municipality = @municipality,
          ward_number = @ward_number, date_of_birth = @date_of_birth,
          id_number = @id_number, id_issue_date = @id_issue_date,
          father_spouse_name = @father_spouse_name, updated_at = GETDATE()
        WHERE id = @id AND user_id = @user_id
      `);
    res.json({ message: 'Sender updated successfully' });
  } catch (err) {
    console.error('❌ updateSender error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteSender = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('UPDATE senders SET is_active = 0 WHERE id = @id AND user_id = @user_id');
    res.json({ message: 'Sender deleted successfully' });
  } catch (err) {
    console.error('❌ deleteSender error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getSenders, getSenderById, createSender, updateSender, deleteSender };