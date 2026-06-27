const asyncHandler = require('express-async-handler');
const { User, Campus, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/token');
const { USER_STATUS, ROLES } = require('../config/constants');

// Roles a person can self-select at registration.
// Nobody can register directly as super_admin/campus_admin through the public
// endpoint - those are assigned manually in the DB or promoted by an existing admin.
const SELF_REGISTERABLE_ROLES = [ROLES.STUDENT, ROLES.STAFF, ROLES.DEPT_HEAD];

function issueTokenPair(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    universityId,
    email,
    password,
    phone,
    role,
    campusId,
    collegeId,
    departmentId,
  } = req.body;

  if (!fullName || !universityId || !email || !password || !campusId) {
    throw new AppError(400, 'fullName, universityId, email, password, and campusId are required');
  }

  const requestedRole = role && SELF_REGISTERABLE_ROLES.includes(role) ? role : ROLES.STUDENT;

  const campus = await Campus.findById(campusId);
  if (!campus) throw new AppError(404, 'Selected campus does not exist');

  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) throw new AppError(404, 'Selected department does not exist');
  }

  const existing = await User.findOne({ $or: [{ email }, { universityId }] });
  if (existing) {
    throw new AppError(409, 'An account with this email or university ID already exists');
  }

  const user = await User.create({
    fullName,
    universityId,
    email,
    password,
    phone,
    role: requestedRole,
    campusId,
    collegeId: collegeId || null,
    departmentId: departmentId || null,
    status: USER_STATUS.PENDING,
  });

  return sendSuccess(
    res,
    201,
    'Registration successful. Your account is pending approval before you can log in.',
    { user: user.toSafeJSON() }
  );
});

// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password +refreshTokenHash');
  if (!user) throw new AppError(401, 'Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError(401, 'Invalid email or password');

  if (user.status === USER_STATUS.PENDING) {
    throw new AppError(403, 'Your account is still pending approval by an administrator');
  }
  if (user.status === USER_STATUS.REJECTED) {
    throw new AppError(403, 'Your account registration was rejected. Contact your campus admin');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AppError(403, 'Your account has been suspended. Contact your campus admin');
  }

  const { accessToken, refreshToken } = issueTokenPair(user);

  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, 200, 'Login successful', {
    user: user.toSafeJSON(),
    accessToken,
  });
});

// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh cookie)
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError(401, 'No refresh token provided');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    throw new AppError(401, 'Refresh session not found, please log in again');
  }

  if (user.refreshTokenHash !== hashToken(token)) {
    // Token reuse/mismatch - invalidate the stored session defensively.
    user.refreshTokenHash = null;
    await user.save();
    throw new AppError(401, 'Refresh token no longer valid, please log in again');
  }

  if (user.status !== USER_STATUS.APPROVED) {
    throw new AppError(403, 'Account is not active');
  }

  const { accessToken, refreshToken: newRefreshToken } = issueTokenPair(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, 200, 'Token refreshed', { accessToken });
});

// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendSuccess(res, 200, 'Logged out successfully');
});

// @route   GET /api/auth/me
// @access  Private
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('campusId', 'name type')
    .populate('collegeId', 'name')
    .populate('departmentId', 'name');

  return sendSuccess(res, 200, 'Current user fetched', { user });
});

module.exports = { register, login, refresh, logout, me };
