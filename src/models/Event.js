const mongoose = require('mongoose');
const {
  EVENT_CATEGORIES,
  EVENT_STATUS,
  VISIBILITY,
} = require('../config/constants');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(EVENT_CATEGORIES),
      required: true,
    },
    startsAt: {
      type: Date,
      required: [true, 'Event start time is required'],
    },
    endsAt: {
      type: Date,
      required: [true, 'Event end time is required'],
      validate: {
        validator: function (value) {
          // Works for both create (this.startsAt) and update via runValidators with context.
          return !this.startsAt || value > this.startsAt;
        },
        message: 'endsAt must be after startsAt',
      },
    },
    location: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.DEPARTMENT_ONLY,
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.PUBLISHED,
    },
    bannerUrl: {
      type: String,
      default: null,
    },
    capacity: {
      type: Number,
      min: 0,
      default: null, // null = unlimited
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
  },
  { timestamps: true }
);

eventSchema.index({ campusId: 1, startsAt: 1 });
eventSchema.index({ departmentId: 1, startsAt: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
