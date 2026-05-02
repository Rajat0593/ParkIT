const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const constants = require('../config/constants');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  transaction_type: {
    type: DataTypes.ENUM(...Object.values(constants.TRANSACTION_TYPE)),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'upi', 'wallet'),
    allowNull: false
  },
  payment_gateway_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
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
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['booking_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

module.exports = Transaction;
