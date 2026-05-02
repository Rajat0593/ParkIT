const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ==================== REGISTRATION ====================

const register = async (req, res, next) => {
  try {
    const { email, phone, password, first_name, last_name, user_type } = req.body;

    const result = await authService.register(email, phone, password, first_name, last_name, user_type);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== VERIFY OTP ====================

const verifyOTP = async (req, res, next) => {
  try {
    const { otp_id, otp, registration_data } = req.body;

    if (!registration_data) {
      throw new AppError('Registration data is required', 400);
    }

    const result = await authService.verifyOTP(otp_id, otp, registration_data);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== LOGIN ====================

const login = async (req, res, next) => {
  try {
    const { email_or_phone, password } = req.body;

    const result = await authService.login(email_or_phone, password);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== REFRESH TOKEN ====================

const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError('Refresh token is required', 400);
    }

    const result = await authService.refreshAccessToken(refresh_token);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== RESEND OTP ====================

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const result = await authService.resendOTP(email);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ==================== LOGOUT ====================

const logout = async (req, res, next) => {
  try {
    // Token invalidation would be handled on client side
    // In production, you might store invalidated tokens in a blacklist
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  refreshToken,
  resendOTP,
  logout
};
