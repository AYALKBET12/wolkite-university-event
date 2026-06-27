const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Run after express-validator chains to turn validation failures into a
// consistent AppError instead of letting each controller check manually.
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(400, 'Validation failed', messages));
  }
  next();
}

module.exports = handleValidation;
