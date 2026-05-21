

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const { connectDB } = require('./config/database');
// const { connectRedis } = require('./config/redis');
// const authRoutes = require('./routes/authRoutes');
// const senderRoutes = require('./routes/senderRoutes');
// const receiverRoutes = require('./routes/receiverRoutes');
// const transactionRoutes = require('./routes/transactionRoutes');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = process.env.PORT || 8000;

// app.get('/', (req, res) => {
//   res.json({ message: '✅ Money Transfer API Running' });
// });

// app.use((req, res, next) => {
//   console.log(`📥 ${req.method} ${req.url}`);
//   next();
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/senders', senderRoutes);
// app.use('/api/receivers', receiverRoutes);
// app.use('/api/transactions', transactionRoutes);

// app.use((req, res) => {
//   res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
// });

// async function startServer() {
//   try {
//     await connectDB();
//     await connectRedis();
//     app.listen(PORT, () => {
//       console.log('');
//       console.log('✅ MSSQL Connected');
//       console.log('✅ Redis Connected');
//       console.log(`✅ Server running on http://localhost:${PORT}`);
//       console.log('');
//       console.log('📌 Available routes:');
//       console.log(`   POST   /api/auth/register`);
//       console.log(`   POST   /api/auth/verify-otp`);
//       console.log(`   POST   /api/auth/login`);
//       console.log(`   GET    /api/senders`);
//       console.log(`   POST   /api/senders`);
//       console.log(`   GET    /api/receivers`);
//       console.log(`   POST   /api/receivers`);
//       console.log(`   POST   /api/transactions/send`);
//       console.log(`   GET    /api/transactions`);
//       console.log(`   POST   /api/transactions/calculate-fee`);
//       console.log('');
//     });
//   } catch (err) {
//     console.error('❌ Failed to start server:', err.message);
//   }
// }

// startServer();

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/authRoutes');
const senderRoutes = require('./routes/senderRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const geoRoutes = require('./routes/geoRoutes'); // ← ADD THIS

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.json({ message: '✅ Money Transfer API Running' });
});

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/geo', geoRoutes); // ← ADD THIS

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ MSSQL Connected');
      console.log('✅ Redis Connected');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log('');
      console.log('📌 Available routes:');
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/verify-otp`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/senders`);
      console.log(`   POST   /api/senders`);
      console.log(`   GET    /api/receivers`);
      console.log(`   POST   /api/receivers`);
      console.log(`   POST   /api/transactions/send`);
      console.log(`   GET    /api/transactions`);
      console.log(`   POST   /api/transactions/calculate-fee`);
      console.log(`   GET    /api/geo/provinces`);       // ← ADD THIS
      console.log(`   GET    /api/geo/districts/:province`); // ← ADD THIS
      console.log(`   GET    /api/geo/banks`);           // ← ADD THIS
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
  }
}

startServer();