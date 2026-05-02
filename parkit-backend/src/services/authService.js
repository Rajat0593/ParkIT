const User = require('../models/User');
const { generateOTP, generateOTPId, hashPassword, comparePasswords, generateTokens, isValidEmail, isValidPhone } = require('../utils/helpers');
const { sendOTPEmail } = require('./emailService');
const { AppError } = require('../middleware/errorHandler');
const constants = require('../config/constants');
const logger = require('../utils/logger');

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map();

// ==================== OTP MANAGEMENT ====================

const storeOTP = (otpId, email, otp) => {
  otpStore.set(otpId, {
    email,
    otp,
    createdAt: Date.now(),
    attempts: 0
  });

  // Auto-delete OTP after expiration time
  setTimeout(() => {
    otpStore.delete(otpId);
  }, 10 * 60 * 1000); // 10 minutes
};

const getOTP = (otpId) => {
  return otpStore.get(otpId);
};

const deleteOTP = (otpId) => {
  otpStore.delete(otpId);
};

const isOTPExpired = (otp) => {
  const expirationTime = 10 * 60 * 1000; // 10 minutes
  return Date.now() - otp.createdAt > expirationTime;
};

// ==================== AUTHENTICATION SERVICE ====================

const register = async (email, phone, password, firstName, lastName, userType) => {
  try {
    // Validate inputs
    if (!isValidEmail(email)) {
      throw new AppError('Invalid email format', 400, constants.ERROR_CODES.VALIDATION_ERROR);
    }

    if (!isValidPhone(phone)) {
      throw new AppError('Invalid phone format', 400, constants.ERROR_CODES.VALIDATION_ERROR);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409, constants.ERROR_CODES.USER_ALREADY_EXISTS);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpId = generateOTPId();

    // Store OTP
    storeOTP(otpId, email, otp);

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      logger.warn('Failed to send OTP email during registration', { email });
    }

    // Return OTP ID for verification (in production, don't expose OTP)
    return {
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      otpId,
      registrationData: {
        email,
        phone,
        password,
        firstName,
        lastName,
        userType
      }
    };
  } catch (error) {
    logger.error('Registration error:', error.message);
    throw error;
  }
};

const verifyOTP = async (otpId, otp, registrationData) => {
  try {
    const storedOTP = getOTP(otpId);

    if (!storedOTP) {
      throw new AppError('Invalid OTP ID', 400, constants.ERROR_CODES.INVALID_OTP);
    }

    if (isOTPExpired(storedOTP)) {
      deleteOTP(otpId);
      throw new AppError('OTP has expired. Please request a new one.', 400, constants.ERROR_CODES.OTP_EXPIRED);
    }

    if (storedOTP.attempts >= 3) {
      deleteOTP(otpId);
      throw new AppError('Too many OTP attempts. Please request a new one.', 429, constants.ERROR_CODES.INVALID_OTP);
    }

    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      throw new AppError('Invalid OTP', 400, constants.ERROR_CODES.INVALID_OTP);
    }

    // Create user
    const user = await User.create({
      email: registrationData.email,
      phone: registrationData.phone,
      password_hash: registrationData.password,
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      user_type: registrationData.userType
    });

    // Delete OTP after successful verification
    deleteOTP(otpId);

    // Generate tokens
    const { token, refreshToken } = generateTokens(user.id, user.email, user.user_type);

    logger.info(`User registered successfully: ${user.email}`);

    return {
      success: true,
      message: 'Registration successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      }
    };
  } catch (error) {
    logger.error('OTP verification error:', error.message);
    throw error;
  }
};

const login = async (emailOrPhone, password) => {
  try {
    // Find user
    const user = await User.findOne({
      where: isValidEmail(emailOrPhone) ? { email: emailOrPhone } : { phone: emailOrPhone }
    });

    if (!user) {
      throw new AppError('Invalid email/phone or password', 401, constants.ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (!user.is_active) {
      throw new AppError('Your account has been deactivated', 403, constants.ERROR_CODES.FORBIDDEN);
    }

    // Compare password
    const isPasswordValid = await comparePasswords(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email/phone or password', 401, constants.ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user.id, user.email, user.user_type);

    logger.info(`User logged in successfully: ${user.email}`);

    return {
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        kycVerified: user.kyc_verified,
        rating: user.rating
      }
    };
  } catch (error) {
    logger.error('Login error:', error.message);
    throw error;
  }
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const { verifyToken } = require('../utils/helpers');
    const decoded = verifyToken(refreshToken, true);

    if (!decoded) {
      throw new AppError('Invalid refresh token', 401, constants.ERROR_CODES.UNAUTHORIZED);
    }

    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      throw new AppError('User not found or inactive', 401, constants.ERROR_CODES.UNAUTHORIZED);
    }

    const tokens = generateTokens(user.id, user.email, user.user_type);

    return {
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken
    };
  } catch (error) {
    logger.error('Refresh token error:', error.message);
    throw error;
  }
};

const resendOTP = async (email) => {
  try {
    if (!isValidEmail(email)) {
      throw new AppError('Invalid email format', 400, constants.ERROR_CODES.VALIDATION_ERROR);
    }

    const otp = generateOTP();
    const otpId = generateOTPId();

    storeOTP(otpId, email, otp);

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      throw new AppError('Failed to send OTP. Please try again.', 500);
    }

    return {
      success: true,
      message: 'OTP resent successfully',
      otpId
    };
  } catch (error) {
    logger.error('Resend OTP error:', error.message);
    throw error;
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  refreshAccessToken,
  resendOTP
};
