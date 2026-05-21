const { NEPAL_PROVINCES, NEPAL_DISTRICTS, NEPAL_BANKS } = require('../data/nepalData');

const getProvinces = (req, res) => {
  res.json({ provinces: NEPAL_PROVINCES });
};

const getDistricts = (req, res) => {
  const { province } = req.params;
  const districts = NEPAL_DISTRICTS[province];
  if (!districts) {
    return res.status(404).json({ message: 'Province not found' });
  }
  res.json({ districts });
};

const getBanks = (req, res) => {
  res.json({ banks: NEPAL_BANKS });
};

module.exports = { getProvinces, getDistricts, getBanks };