const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateVerifyOTP } = require('../middleware/validation');

const router = express.Router();

// Registration
router.post('/register', validateRegister, authController.register);

// Verify OTP
router.post('/verify-otp', validateVerifyOTP, authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', authController.resendOTP);

// Login
router.post('/login', validateLogin, authController.login);

// Refresh Token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
