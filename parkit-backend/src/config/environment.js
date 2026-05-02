// Environment configuration
module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',

  // Database
  DB: {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT,
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    EXPIRE: process.env.JWT_EXPIRE || '24h',
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  // OTP
  OTP: {
    EXPIRE_MINUTES: parseInt(process.env.OTP_EXPIRE_MINUTES) || 10,
    LENGTH: parseInt(process.env.OTP_LENGTH) || 6
  },

  // Email
  EMAIL: {
    HOST: process.env.MAIL_HOST,
    PORT: process.env.MAIL_PORT,
    USER: process.env.MAIL_USER,
    PASSWORD: process.env.MAIL_PASSWORD,
    FROM: process.env.MAIL_FROM
  },

  // File Upload
  FILE_UPLOAD: {
    PATH: process.env.UPLOAD_PATH || './uploads',
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  },

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || '*',

  // Logging
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'debug',
    FILE: process.env.LOG_FILE || './logs/app.log'
  },

  // Payment
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID,
    SECRET: process.env.RAZORPAY_SECRET
  }
};
