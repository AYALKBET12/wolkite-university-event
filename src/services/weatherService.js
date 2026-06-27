const AppError = require('../utils/AppError');

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Calls OpenWeatherMap's current-weather endpoint for a given lat/lon.
 * Returns a normalized shape matching our WeatherLog schema fields.
 */
async function fetchCurrentWeather(latitude, longitude) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'PASTE_YOUR_OPENWEATHERMAP_KEY_HERE') {
    throw new AppError(
      503,
      'Weather service is not configured. Add a real OPENWEATHER_API_KEY to your .env file'
    );
  }

  if (latitude == null || longitude == null) {
    throw new AppError(400, 'Campus is missing latitude/longitude, cannot fetch weather');
  }

  const url = `${BASE_URL}?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new AppError(502, 'Failed to reach the weather provider');
  }

  if (response.status === 401) {
    throw new AppError(502, 'Weather provider rejected the API key (invalid or not yet activated)');
  }

  if (!response.ok) {
    throw new AppError(502, `Weather provider returned an error (status ${response.status})`);
  }

  const data = await response.json();

  return {
    tempC: data.main?.temp,
    feelsLikeC: data.main?.feels_like,
    condition: data.weather?.[0]?.main || 'Unknown',
    description: data.weather?.[0]?.description || '',
    humidity: data.main?.humidity,
    windSpeed: data.wind?.speed,
    icon: data.weather?.[0]?.icon || null,
  };
}

module.exports = { fetchCurrentWeather };
