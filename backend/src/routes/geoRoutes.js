const express = require('express');
const router = express.Router();
const { getProvinces, getDistricts, getBanks } = require('../controllers/geoController');

router.get('/provinces', getProvinces);
router.get('/districts/:province', getDistricts);
router.get('/banks', getBanks);

module.exports = router;