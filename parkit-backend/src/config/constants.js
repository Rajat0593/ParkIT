// Application constants
module.exports = {
  // User types
  USER_TYPES: {
    CAR_OWNER: 'car_owner',
    SPACE_PROVIDER: 'space_provider',
    ADMIN: 'admin'
  },

  // Booking types
  BOOKING_TYPES: {
    HOURLY: 'hourly',
    DAILY: 'daily',
    MONTHLY: 'monthly'
  },

  // Booking statuses
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },

  // Transaction types
  TRANSACTION_TYPE: {
    DEBIT: 'debit',
    CREDIT: 'credit'
  },

  // Vehicle types
  VEHICLE_TYPES: {
    CAR: 'car',
    BIKE: 'bike',
    TRUCK: 'truck'
  },

  // KYC verification status
  KYC_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
  },

  // Space verification status
  SPACE_VERIFICATION: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
  },

  // Amenities
  AMENITIES: [
    'covered',
    'security',
    'washing',
    'maintenance',
    'charging',
    'lighting',
    'cctv'
  ],

  // Error codes
  ERROR_CODES: {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_OTP: 'INVALID_OTP',
    OTP_EXPIRED: 'OTP_EXPIRED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SPACE_NOT_FOUND: 'SPACE_NOT_FOUND',
    BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
    INSUFFICIENT_SLOTS: 'INSUFFICIENT_SLOTS',
    PAYMENT_FAILED: 'PAYMENT_FAILED'
  },

  // Default pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Search
  SEARCH: {
    DEFAULT_RADIUS_KM: 10,
    MAX_RADIUS_KM: 50
  }
};
