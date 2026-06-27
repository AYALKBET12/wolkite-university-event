const mongoose = require('mongoose');

const weatherLogSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
    },
    tempC: {
      type: Number,
      required: true,
    },
    feelsLikeC: {
      type: Number,
    },
    condition: {
      type: String, // e.g. "Clear", "Rain", "Clouds"
      required: true,
    },
    description: {
      type: String, // e.g. "light rain"
    },
    humidity: {
      type: Number,
    },
    windSpeed: {
      type: Number,
    },
    icon: {
      type: String, // OpenWeatherMap icon code
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Most recent log per campus is the common query pattern.
weatherLogSchema.index({ campusId: 1, fetchedAt: -1 });

module.exports = mongoose.model('WeatherLog', weatherLogSchema);
