// Keeps every endpoint's response shape consistent:
// { success, message, data, ...extra }

function sendSuccess(res, statusCode, message, data = null, extra = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
}

function sendError(res, statusCode, message, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { sendSuccess, sendError };
