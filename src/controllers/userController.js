const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, USER_STATUS } = require('../config/constants');

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN];

// @route   GET /api/users?status=&role=&departmentId=
// @access  super_admin (any campus), campus_admin (own campus), dept_head (own dept, read-only)
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) filter.campusId = req.campusScope;
  else if (req.query.campusId) filter.campusId = req.query.campusId;

  // dept_head can only browse their own department's users
  if (req.user.role === ROLES.DEPT_HEAD) {
    filter.departmentId = req.user.departmentId;
  } else if (req.query.departmentId) {
    filter.departmentId = req.query.departmentId;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('campusId', 'name')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Users fetched', {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route   GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('campusId', 'name')
    .populate('departmentId', 'name');

  if (!user) throw new AppError(404, 'User not found');

  if (req.campusScope && String(user.campusId._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You do not have access to this user');
  }

  return sendSuccess(res, 200, 'User fetched', { user });
});

// @route   PATCH /api/users/:id/approve
// @access  super_admin, campus_admin (own campus), dept_head (own department only)
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'User not found');

  if (req.campusScope && String(user.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only approve users within your own campus');
  }
  if (req.user.role === ROLES.DEPT_HEAD && String(user.departmentId) !== String(req.user.departmentId)) {
    throw new AppError(403, 'You can only approve users within your own department');
  }
  if (![...ADMIN_ROLES, ROLES.DEPT_HEAD].includes(req.user.role)) {
    throw new AppError(403, 'You do not have permission to approve users');
  }

  user.status = USER_STATUS.APPROVED;
  user.approvedBy = req.user._id;
  user.approvedAt = new Date();
  await user.save();

  return sendSuccess(res, 200, 'User approved successfully', { user: user.toSafeJSON() });
});

// @route   PATCH /api/users/:id/reject
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'User not found');

  if (req.campusScope && String(user.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only reject users within your own campus');
  }
  if (req.user.role === ROLES.DEPT_HEAD && String(user.departmentId) !== String(req.user.departmentId)) {
    throw new AppError(403, 'You can only reject users within your own department');
  }
  if (![...ADMIN_ROLES, ROLES.DEPT_HEAD].includes(req.user.role)) {
    throw new AppError(403, 'You do not have permission to reject users');
  }

  user.status = USER_STATUS.REJECTED;
  user.approvedBy = req.user._id;
  user.approvedAt = new Date();
  await user.save();

  return sendSuccess(res, 200, 'User rejected', { user: user.toSafeJSON() });
});

// @route   PATCH /api/users/:id/suspend
// @access  super_admin, campus_admin (own campus)
const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'User not found');

  if (req.campusScope && String(user.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only suspend users within your own campus');
  }

  user.status = USER_STATUS.SUSPENDED;
  user.refreshTokenHash = null; // force logout of any active session
  await user.save();

  return sendSuccess(res, 200, 'User suspended', { user: user.toSafeJSON() });
});

// @route   PUT /api/users/:id  (self-update profile, or admin editing someone)
// @access  Self, or super_admin/campus_admin within scope
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'User not found');

  const isSelf = String(user._id) === String(req.user._id);
  const isPrivileged = ADMIN_ROLES.includes(req.user.role);

  if (!isSelf && !isPrivileged) throw new AppError(403, 'You can only update your own profile');
  if (!isSelf && req.campusScope && String(user.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only update users within your own campus');
  }

  // Everyone can update their own basic info
  const selfFields = ['fullName', 'phone', 'avatarUrl'];
  selfFields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });

  // Only privileged roles can change role/department/college assignment
  if (isPrivileged) {
    const adminFields = ['role', 'departmentId', 'collegeId'];
    adminFields.forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
  }

  await user.save();

  return sendSuccess(res, 200, 'User updated successfully', { user: user.toSafeJSON() });
});

// @route   DELETE /api/users/:id
// @access  super_admin, campus_admin (own campus) - cannot delete self
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'User not found');

  if (String(user._id) === String(req.user._id)) {
    throw new AppError(400, 'You cannot delete your own account');
  }
  if (req.campusScope && String(user.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete users within your own campus');
  }

  await user.deleteOne();

  return sendSuccess(res, 200, 'User deleted successfully');
});

module.exports = {
  getUsers,
  getUserById,
  approveUser,
  rejectUser,
  suspendUser,
  updateUser,
  deleteUser,
};
