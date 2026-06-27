const express = require('express');
const router = express.Router();
const { getCampusWeather, getCampusWeatherHistory } = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');

router.use(protect, applyCampusScope);

router.get('/:campusId', getCampusWeather);
router.get('/:campusId/history', getCampusWeatherHistory);

module.exports = router;
