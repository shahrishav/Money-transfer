const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getSenders,
  getSenderById,
  createSender,
  updateSender,
  deleteSender,
} = require('../controllers/senderController');

router.use(authMiddleware);

router.get('/', getSenders);
router.get('/:id', getSenderById);
router.post('/', createSender);
router.put('/:id', updateSender);
router.delete('/:id', deleteSender);

module.exports = router;