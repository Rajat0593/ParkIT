const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/environment');

// ==================== PASSWORD UTILITIES ====================

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// ==================== JWT UTILITIES ====================

const generateTokens = (userId, email, userType) => {
  const token = jwt.sign(
    { id: userId, email, userType },
    config.JWT.SECRET,
    { expiresIn: config.JWT.EXPIRE }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    config.JWT.REFRESH_SECRET,
    { expiresIn: config.JWT.REFRESH_EXPIRE }
  );

  return { token, refreshToken };
};

const verifyToken = (token, useRefreshSecret = false) => {
  try {
    const secret = useRefreshSecret ? config.JWT.REFRESH_SECRET : config.JWT.SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// ==================== OTP UTILITIES ====================

const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

const generateOTPId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// ==================== EMAIL UTILITIES ====================

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// ==================== LOCATION UTILITIES ====================

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ==================== UUID UTILITIES ====================

const { v4: uuidv4 } = require('uuid');

const generateUUID = () => uuidv4();

// ==================== PAGINATION UTILITIES ====================

const getPaginationParams = (page = 1, limit = 20) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = {
  // Password
  hashPassword,
  comparePasswords,

  // JWT
  generateTokens,
  verifyToken,

  // OTP
  generateOTP,
  generateOTPId,

  // Email/Phone validation
  isValidEmail,
  isValidPhone,

  // Location
  calculateDistance,

  // UUID
  generateUUID,

  // Pagination
  getPaginationParams
};
