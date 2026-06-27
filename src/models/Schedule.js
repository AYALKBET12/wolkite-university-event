const mongoose = require('mongoose');

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const scheduleSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dayOfWeek: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true,
    },
    startTime: {
      // Stored as "HH:mm" 24-hour string for simple display/sort.
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:mm format'],
    },
    room: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true, // e.g. "2026 - Semester 2"
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ departmentId: 1, dayOfWeek: 1 });
scheduleSchema.index({ campusId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
module.exports.DAYS_OF_WEEK = DAYS_OF_WEEK;
