const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: [true, 'College must belong to a campus'],
    },
    description: {
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

// A college name should be unique within its own campus (not globally)
collegeSchema.index({ campusId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('College', collegeSchema);
