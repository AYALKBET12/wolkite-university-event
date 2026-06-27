const mongoose = require('mongoose');
const { REGISTRATION_STATUS } = require('../config/constants');

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.REGISTERED,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// A user can only register once per event (re-registering after cancel
// is handled in the controller by flipping status, not inserting a new doc).
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
