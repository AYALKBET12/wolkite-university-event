const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_LIST, ROLES, USER_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    universityId: {
      type: String,
      required: [true, 'University ID is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never return password by default
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ROLE_LIST,
      default: ROLES.STUDENT,
    },
    // Approval workflow: a newly registered user is "pending" until an
    // appropriate admin/dept_head approves their requested role.
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: [true, 'User must be associated with a campus'],
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
    avatarUrl: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ campusId: 1, role: 1 });
userSchema.index({ departmentId: 1 });

// Hash password before saving, only if it was changed.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never leak password/refreshTokenHash even if select() is bypassed somewhere.
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
