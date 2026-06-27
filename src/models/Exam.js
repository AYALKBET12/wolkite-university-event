const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
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
    examType: {
      type: String,
      enum: ['quiz', 'midterm', 'final', 'makeup'],
      default: 'final',
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:mm format'],
    },
    endTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:mm format'],
    },
    room: {
      type: String,
      trim: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ departmentId: 1, examDate: 1 });
examSchema.index({ campusId: 1, examDate: 1 });

module.exports = mongoose.model('Exam', examSchema);
