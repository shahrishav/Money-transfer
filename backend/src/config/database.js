const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

const connectDB = async () => {
  try {
    pool = await sql.connect(dbConfig);
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) throw new Error('Database not initialized');
  return pool;
};

module.exports = { connectDB, getPool, sql };