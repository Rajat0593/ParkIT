const { body, validationResult, query } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    return next(new AppError(
      'Validation Error',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    ));
  }
  next();
};

// ==================== AUTH VALIDATORS ====================

const validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('user_type')
    .isIn(['car_owner', 'space_provider'])
    .withMessage('User type must be either car_owner or space_provider'),
  handleValidationErrors
];

const validateLogin = [
  body('email_or_phone').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateVerifyOTP = [
  body('otp_id').notEmpty().withMessage('OTP ID is required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
  handleValidationErrors
];

// ==================== USER VALIDATORS ====================

const validateUpdateProfile = [
  body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  handleValidationErrors
];

const validateKYCUpload = [
  body('document_type')
    .isIn(['aadhar', 'pan', 'driving_license', 'passport'])
    .withMessage('Invalid document type'),
  handleValidationErrors
];

// ==================== SPACE VALIDATORS ====================

const validateCreateSpace = [
  body('name').trim().notEmpty().withMessage('Space name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('total_slots').isInt({ min: 1 }).withMessage('Total slots must be at least 1'),
  body('price_per_day').isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('vehicle_types').isArray().withMessage('Vehicle types must be an array'),
  handleValidationErrors
];

const validateSearchSpaces = [
  query('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isInt({ min: 1, max: 50 }).withMessage('Radius must be between 1-50 km'),
  query('min_price').optional().isFloat({ min: 0 }).withMessage('Invalid min price'),
  query('max_price').optional().isFloat({ min: 0 }).withMessage('Invalid max price'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  handleValidationErrors
];

// ==================== BOOKING VALIDATORS ====================

const validateCreateBooking = [
  body('space_id').notEmpty().withMessage('Space ID is required'),
  body('vehicle_id').notEmpty().withMessage('Vehicle ID is required'),
  body('check_in_date').isISO8601().withMessage('Invalid check-in date'),
  body('check_out_date').isISO8601().withMessage('Invalid check-out date'),
  body('booking_type')
    .isIn(['hourly', 'daily', 'monthly'])
    .withMessage('Invalid booking type'),
  handleValidationErrors
];

// ==================== VEHICLE VALIDATORS ====================

const validateAddVehicle = [
  body('vehicle_type')
    .isIn(['car', 'bike', 'truck'])
    .withMessage('Invalid vehicle type'),
  body('registration_number')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)
    .withMessage('Invalid registration number format'),
  body('make').optional().trim(),
  body('model').optional().trim(),
  body('year').optional().isInt({ min: 1900, max: 2100 }).withMessage('Invalid year'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateVerifyOTP,
  validateUpdateProfile,
  validateKYCUpload,
  validateCreateSpace,
  validateSearchSpaces,
  validateCreateBooking,
  validateAddVehicle
};
