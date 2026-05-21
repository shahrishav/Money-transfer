
// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware');
// const {
//   sendMoney,
//   receiveMoney,
//   lookupByPIN,
//   getTransactions,
//   calculateFee,
// } = require('../controllers/transactionController');

// router.use(authMiddleware);

// router.post('/send', sendMoney);
// router.post('/lookup-pin', lookupByPIN);   // ← was missing
// router.post('/receive', receiveMoney);      // ← was missing
// router.get('/', getTransactions);
// router.post('/calculate-fee', calculateFee);

// module.exports = router;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  sendMoney,
  receiveMoney,
  lookupPIN,
  getTransactions,
  calculateFee,
  markAsPaid,
} = require('../controllers/transactionController');

router.use(authMiddleware);

router.post('/calculate-fee', calculateFee);
router.post('/send', sendMoney);
router.post('/lookup-pin', lookupPIN);
router.post('/receive', receiveMoney);
router.put('/:id/mark-paid', markAsPaid);
router.get('/', getTransactions);

module.exports = router;