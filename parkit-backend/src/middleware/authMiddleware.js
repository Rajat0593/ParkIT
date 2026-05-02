const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');
const config = require('../config/environment');
const constants = require('../config/constants');

// Protect routes - check if user is authenticated
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Please log in to access this resource', 401, constants.ERROR_CODES.UNAUTHORIZED));
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT.SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    logger.error('Auth error:', error.message);
    return next(new AppError('Invalid or expired token', 401, constants.ERROR_CODES.UNAUTHORIZED));
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401, constants.ERROR_CODES.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.userType)) {
      return next(new AppError('You do not have permission to access this resource', 403, constants.ERROR_CODES.FORBIDDEN));
    }

    next();
  };
};

module.exports = { protect, authorize };
