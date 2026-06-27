const mongoose = require('mongoose');
const { APPROVAL_STATUS, INTERNSHIP_TYPES } = require('../config/constants');

const internshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company / organization name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(INTERNSHIP_TYPES),
      default: INTERNSHIP_TYPES.INTERNSHIP,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    applyUrl: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    deadline: {
      type: Date,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // open postings may not be department-specific
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
    },
    // Same moderation workflow as Research.
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

internshipSchema.index({ campusId: 1, status: 1 });
internshipSchema.index({ departmentId: 1, status: 1 });
internshipSchema.index({ deadline: 1 });

module.exports = mongoose.model('Internship', internshipSchema);
