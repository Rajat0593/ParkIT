const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const constants = require('../config/constants');

const Vehicle = sequelize.define('Vehicle', {
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
  vehicle_type: {
    type: DataTypes.ENUM(...Object.values(constants.VEHICLE_TYPES)),
    allowNull: false
  },
  make: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: 2100
    }
  },
  registration_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  chassis_number: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  nfc_tag_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  vehicle_image_url: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'vehicles',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['registration_number']
    }
  ]
});

module.exports = Vehicle;
