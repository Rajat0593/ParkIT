const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const constants = require('../config/constants');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  space_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'parking_spaces',
      key: 'id'
    }
  },
  vehicle_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  check_in_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  check_in_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  check_out_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  booking_type: {
    type: DataTypes.ENUM(...Object.values(constants.BOOKING_TYPES)),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...Object.values(constants.BOOKING_STATUS)),
    defaultValue: constants.BOOKING_STATUS.PENDING
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM(...Object.values(constants.PAYMENT_STATUS)),
    defaultValue: constants.PAYMENT_STATUS.PENDING
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['space_id']
    },
    {
      fields: ['check_in_date', 'check_out_date']
    }
  ]
});

module.exports = Booking;
