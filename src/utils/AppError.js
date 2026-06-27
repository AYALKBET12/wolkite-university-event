// Throw this from anywhere in controllers/middleware to produce a
// consistent, intentional HTTP error (as opposed to an unexpected crash).
class AppError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
