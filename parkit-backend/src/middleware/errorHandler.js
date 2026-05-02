const logger = require('../utils/logger');
const constants = require('../config/constants');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    err = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again.';
    err = new AppError(message, 401, constants.ERROR_CODES.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired. Please login again.';
    err = new AppError(message, 401, constants.ERROR_CODES.UNAUTHORIZED);
  }

  // Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    const message = `${field} already exists`;
    err = new AppError(message, 400, constants.ERROR_CODES.USER_ALREADY_EXISTS);
  }

  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    err = new AppError(message, 400, constants.ERROR_CODES.VALIDATION_ERROR);
  }

  logger.error(`Error: ${err.message}`, {
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  res.status(err.statusCode).json({
    status: 'error',
    message: err.message,
    errorCode: err.errorCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler: errorHandler, AppError };
