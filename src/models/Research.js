const mongoose = require('mongoose');
const { APPROVAL_STATUS } = require('../config/constants');

const researchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Research title is required'],
      trim: true,
    },
    abstractText: {
      type: String,
      required: [true, 'Abstract is required'],
      trim: true,
    },
    keywords: [{ type: String, trim: true }],
    fileUrl: {
      type: String,
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coAuthors: [{ type: String, trim: true }], // free text names, not all are system users
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
    // Approval workflow: student-submitted research is "pending" until a
    // staff/dept_head/admin approves it for public visibility.
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
    publishedYear: {
      type: Number,
    },
  },
  { timestamps: true }
);

researchSchema.index({ departmentId: 1, status: 1 });
researchSchema.index({ campusId: 1, status: 1 });
researchSchema.index({ authorId: 1 });

module.exports = mongoose.model('Research', researchSchema);
