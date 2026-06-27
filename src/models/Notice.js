const mongoose = require('mongoose');
const { NOTICE_PRIORITY, VISIBILITY } = require('../config/constants');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Notice body is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(NOTICE_PRIORITY),
      default: NOTICE_PRIORITY.NORMAL,
    },
    // Reuses the same visibility scopes as Event for consistency.
    targetScope: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.CAMPUS_WIDE,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    postedBy: {
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
    expiresAt: {
      type: Date,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

noticeSchema.index({ campusId: 1, createdAt: -1 });
noticeSchema.index({ departmentId: 1 });
noticeSchema.index({ priority: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
