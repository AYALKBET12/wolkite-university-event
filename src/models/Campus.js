const mongoose = require('mongoose');
const { CAMPUS_TYPES } = require('../config/constants');

const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campus name is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(CAMPUS_TYPES),
      required: true,
      default: CAMPUS_TYPES.SUB,
    },
    // Main campus has parentCampusId = null.
    // Sub-campuses point back to the main campus.
    parentCampusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      default: null,
    },
    location: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

campusSchema.index({ type: 1 });

// A main campus should never have a parent; a sub campus must have one.
campusSchema.pre('validate', function (next) {
  if (this.type === CAMPUS_TYPES.MAIN && this.parentCampusId) {
    return next(new Error('Main campus cannot have a parent campus'));
  }
  if (this.type === CAMPUS_TYPES.SUB && !this.parentCampusId) {
    return next(new Error('Sub-campus must reference a parent (main) campus'));
  }
  next();
});

module.exports = mongoose.model('Campus', campusSchema);
