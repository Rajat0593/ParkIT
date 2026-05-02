require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');
const logger = require('./src/utils/logger');
const { testConnection } = require('./src/config/database');
const { initializeDatabase } = require('./src/database/init');
const { verifyConnection: verifyEmailConnection } = require('./src/services/emailService');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // 1. Test database connection
    logger.info('Testing database connection...');
    await testConnection();

    // 2. Initialize database models
    logger.info('Initializing database models...');
    await initializeDatabase();

    // 3. Verify email service (optional)
    logger.info('Verifying email service...');
    await verifyEmailConnection();

    // 4. Start Express server
    server = app.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info(`🚀 ParkIT API Server Started Successfully`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔌 Port: ${PORT}`);
      logger.info(`🌐 URL: ${process.env.API_BASE_URL}`);
      logger.info(`📚 API Docs: ${process.env.API_BASE_URL}/api/v1/docs (coming soon)`);
      logger.info('═══════════════════════════════════════════════════════════');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = server;
