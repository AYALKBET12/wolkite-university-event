const asyncHandler = require('express-async-handler');
const { Campus, WeatherLog } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { fetchCurrentWeather } = require('../services/weatherService');

// How long a cached weather reading is considered fresh before we call the API again.
const CACHE_TTL_MINUTES = 30;

// @route   GET /api/weather/:campusId
// @access  Any authenticated user
// Returns the freshest weather for a campus - from cache if recent enough,
// otherwise fetches live from OpenWeatherMap and stores a new WeatherLog entry.
const getCampusWeather = asyncHandler(async (req, res) => {
  const { campusId } = req.params;

  const campus = await Campus.findById(campusId);
  if (!campus) throw new AppError(404, 'Campus not found');

  if (req.campusScope && String(campus._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You do not have access to this campus');
  }

  const latest = await WeatherLog.findOne({ campusId }).sort({ fetchedAt: -1 });

  const isFresh = latest && Date.now() - new Date(latest.fetchedAt).getTime() < CACHE_TTL_MINUTES * 60 * 1000;

  if (isFresh && req.query.force !== 'true') {
    return sendSuccess(res, 200, 'Weather fetched (cached)', { weather: latest, cached: true });
  }

  const liveData = await fetchCurrentWeather(campus.latitude, campus.longitude);

  const weatherLog = await WeatherLog.create({
    campusId,
    ...liveData,
    fetchedAt: new Date(),
  });

  return sendSuccess(res, 200, 'Weather fetched (live)', { weather: weatherLog, cached: false });
});

// @route   GET /api/weather/:campusId/history?limit=
// @access  Any authenticated user
const getCampusWeatherHistory = asyncHandler(async (req, res) => {
  const { campusId } = req.params;

  const campus = await Campus.findById(campusId);
  if (!campus) throw new AppError(404, 'Campus not found');

  if (req.campusScope && String(campus._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You do not have access to this campus');
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 24, 200);

  const history = await WeatherLog.find({ campusId }).sort({ fetchedAt: -1 }).limit(limit);

  return sendSuccess(res, 200, 'Weather history fetched', { history, count: history.length });
});

module.exports = { getCampusWeather, getCampusWeatherHistory };
