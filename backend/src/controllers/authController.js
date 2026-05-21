const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getPool, sql } = require('../config/database');
const { client } = require('../config/redis');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── REGISTER ────────────────────────────────────────────────
const register = async (req, res) => {
  console.log('📥 Register called with:', req.body);
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const pool = getPool();

    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('full_name', sql.NVarChar, full_name)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, password_hash)
      .query(`
        INSERT INTO users (full_name, email, password_hash)
        VALUES (@full_name, @email, @password_hash)
      `);

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('otp_code', sql.NVarChar, otp)
      .input('expires_at', sql.DateTime, expires_at)
      .query(`
        INSERT INTO otps (email, otp_code, expires_at)
        VALUES (@email, @otp_code, @expires_at)
      `);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code - Money Transfer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Money Transfer App</h2>
          <p>Your OTP verification code is:</p>
          <h1 style="color: #4F46E5; font-size: 48px; letter-spacing: 8px; text-align: center;">${otp}</h1>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p style="color: red;">Do not share this code with anyone.</p>
        </div>
      `,
    });

    console.log('✅ OTP sent to:', email);

    res.status(201).json({
      message: 'Registration successful. OTP sent to your email.',
      email: email,
    });

  } catch (err) {
    console.error('❌ Register error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── VERIFY OTP ──────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  console.log('📥 VerifyOTP called with:', req.body);
  const { email, otp_code } = req.body;

  if (!email || !otp_code) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    try {
      const attempts = await client.get(`otp_attempts:${email}`);
      if (attempts && parseInt(attempts) >= 5) {
        return res.status(429).json({
          message: 'Too many attempts. Try again in 15 minutes.'
        });
      }
    } catch (redisErr) {}

    const pool = getPool();

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('otp_code', sql.NVarChar, otp_code)
      .query(`
        SELECT * FROM otps
        WHERE email = @email
        AND otp_code = @otp_code
        AND is_used = 0
        AND expires_at > GETDATE()
      `);

    if (result.recordset.length === 0) {
      try {
        await client.incr(`otp_attempts:${email}`);
        await client.expire(`otp_attempts:${email}`, 15 * 60);
      } catch (redisErr) {}
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.request()
      .input('id', sql.Int, result.recordset[0].id)
      .query('UPDATE otps SET is_used = 1 WHERE id = @id');

    await pool.request()
      .input('email', sql.NVarChar, email)
      .query('UPDATE users SET is_active = 1 WHERE email = @email');

    try {
      await client.del(`otp_attempts:${email}`);
    } catch (redisErr) {}

    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, full_name, email FROM users WHERE email = @email');

    const user = userResult.recordset[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ OTP verified for:', email);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('❌ VerifyOTP error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────
const login = async (req, res) => {
  console.log('📥 Login called with:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const pool = getPool();

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email AND is_active = 1');

    if (result.recordset.length === 0) {
      return res.status(400).json({
        message: 'Invalid email or password, or account not verified'
      });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { full_name } = req.body;
  if (!full_name) {
    return res.status(400).json({ message: 'Full name is required' });
  }

  try {
    const pool = getPool();

    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('full_name', sql.NVarChar, full_name)
      .query('UPDATE users SET full_name = @full_name, updated_at = GETDATE() WHERE id = @id');

    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT id, full_name, email FROM users WHERE id = @id');

    console.log('✅ Profile updated for user:', req.user.id);

    res.json({
      message: 'Profile updated successfully',
      user: result.recordset[0],
    });

  } catch (err) {
    console.error('❌ updateProfile error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── DELETE ACCOUNT ──────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    const pool = getPool();

    await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('UPDATE users SET is_active = 0, updated_at = GETDATE() WHERE id = @id');

    console.log('✅ Account deactivated for user:', req.user.id);

    res.json({ message: 'Account deactivated successfully' });

  } catch (err) {
    console.error('❌ deleteAccount error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, verifyOTP, login, updateProfile, deleteAccount };