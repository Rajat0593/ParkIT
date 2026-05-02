const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const spaceRoutes = require('./routes/space.routes');
const bookingRoutes = require('./routes/booking.routes');
const vehicleRoutes = require('./routes/vehicle.routes');

const app = express();

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH CHECK ====================
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ParkIT API is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== API ROUTES ====================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/spaces', spaceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot find ${req.originalUrl} on this server`
  });
});

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

module.exports = app;
