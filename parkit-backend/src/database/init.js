const { sequelize } = require('../config/database');
const User = require('../models/User');
const ParkingSpace = require('../models/ParkingSpace');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// Define model associations
const defineAssociations = () => {
  // User associations
  User.hasMany(ParkingSpace, { foreignKey: 'provider_id', as: 'parkingSpaces' });
  User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
  User.hasMany(Vehicle, { foreignKey: 'user_id', as: 'vehicles' });
  User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'reviewsGiven' });
  User.hasMany(Review, { foreignKey: 'reviewee_id', as: 'reviewsReceived' });
  User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });

  // ParkingSpace associations
  ParkingSpace.belongsTo(User, { foreignKey: 'provider_id', as: 'provider' });
  ParkingSpace.hasMany(Booking, { foreignKey: 'space_id', as: 'bookings' });
  ParkingSpace.hasMany(Review, { foreignKey: 'booking_id', as: 'reviews' });

  // Booking associations
  Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Booking.belongsTo(ParkingSpace, { foreignKey: 'space_id', as: 'space' });
  Booking.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
  Booking.hasOne(Transaction, { foreignKey: 'booking_id', as: 'transaction' });

  // Vehicle associations
  Vehicle.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
  Vehicle.hasMany(Booking, { foreignKey: 'vehicle_id', as: 'bookings' });

  // Review associations
  Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
  Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
  Review.belongsTo(User, { foreignKey: 'reviewee_id', as: 'reviewee' });

  // Transaction associations
  Transaction.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
  Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

// Enable PostGIS extension for geospatial queries
const enablePostGIS = async () => {
  try {
    logger.info('Enabling PostGIS extension...');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    logger.info('PostGIS extension enabled');
  } catch (error) {
    logger.warn('Could not create PostGIS extension. Make sure it is installed on your PostgreSQL server.');
    logger.warn('Install PostGIS by running: CREATE EXTENSION postgis;');
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    defineAssociations();

    // Enable PostGIS for geospatial queries
    await enablePostGIS();

    logger.info('Syncing database models...');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });

    logger.info('Database initialized successfully');
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = { initializeDatabase, defineAssociations };
