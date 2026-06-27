const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/token');
const { USER_STATUS } = require('../config/constants');

// Verifies the Bearer access token and attaches the full user doc to req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Not authenticated. Missing Bearer token');
  }

  const token = header.split(' ')[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'User belonging to this token no longer exists');

  if (user.status !== USER_STATUS.APPROVED) {
    throw new AppError(403, 'Account is not active');
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles. Usage: authorize('super_admin', 'campus_admin')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { protect, authorize };
