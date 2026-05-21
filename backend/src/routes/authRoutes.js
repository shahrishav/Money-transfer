
// const express = require('express');
// const router = express.Router();
// const { register, verifyOTP, login } = require('../controllers/authController');

// router.post('/register', register);
// router.post('/verify-otp', verifyOTP);
// router.post('/login', login);

// module.exports = router;
const express = require('express');
const router = express.Router();
const {
  register,
  verifyOTP,
  login,
  updateProfile,
  deleteAccount,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;