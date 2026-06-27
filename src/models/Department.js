const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'Department must belong to a college'],
    },
    // Denormalized for fast filtering/scoping without an extra lookup hop.
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: [true, 'Department must reference its campus'],
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

departmentSchema.index({ collegeId: 1, name: 1 }, { unique: true });
departmentSchema.index({ campusId: 1 });

module.exports = mongoose.model('Department', departmentSchema);
