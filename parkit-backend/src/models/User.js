const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { hashPassword } = require('../utils/helpers');
const constants = require('../config/constants');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    lowercase: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_type: {
    type: DataTypes.ENUM(...Object.values(constants.USER_TYPES)),
    allowNull: false,
    defaultValue: constants.USER_TYPES.CAR_OWNER
  },
  profile_picture_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  kyc_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  kyc_document_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Hash password before saving
User.beforeCreate(async (user) => {
  user.password_hash = await hashPassword(user.password_hash);
});

module.exports = User;
