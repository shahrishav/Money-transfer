// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware');
// const {
//   getReceivers,
//   getReceiverById,
//   createReceiver,
//   updateReceiver,
//   deleteReceiver,
// } = require('../controllers/receiverController');

// router.use(authMiddleware);

// router.get('/', getReceivers);
// router.get('/:id', getReceiverById);
// router.post('/', createReceiver);
// router.put('/:id', updateReceiver);
// router.delete('/:id', deleteReceiver);

// module.exports = router;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { NEPAL_PROVINCES, NEPAL_DISTRICTS, NEPAL_BANKS } = require('../data/nepalData');
const {
  getReceivers,
  getReceiverById,
  createReceiver,
  updateReceiver,
  deleteReceiver,
} = require('../controllers/receiverController');

router.use(authMiddleware);

// ── Nepal geo data — MUST be before /:id ──────────────────────
router.get('/provinces', (req, res) => {
  res.json({ provinces: NEPAL_PROVINCES });
});

router.get('/banks', (req, res) => {
  res.json({ banks: NEPAL_BANKS });
});

router.get('/districts/:province', (req, res) => {
  const province = decodeURIComponent(req.params.province);
  const districts = NEPAL_DISTRICTS[province];
  if (!districts) {
    return res.status(404).json({
      message: 'Province not found',
      valid_provinces: Object.keys(NEPAL_DISTRICTS),
    });
  }
  res.json({ districts });
});

// ── CRUD — /:id routes MUST be after the named routes above ───
router.get('/', getReceivers);
router.post('/', createReceiver);
router.get('/:id', getReceiverById);
router.put('/:id', updateReceiver);
router.delete('/:id', deleteReceiver);

module.exports = router;