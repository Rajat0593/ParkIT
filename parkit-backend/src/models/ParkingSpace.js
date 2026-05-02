const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const constants = require('../config/constants');

const ParkingSpace = sequelize.define('ParkingSpace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  provider_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  location: {
    type: DataTypes.GEOMETRY('POINT', 4326),
    allowNull: true,
    comment: 'PostGIS geometry point for geospatial queries. Format: POINT(longitude latitude)'
  },
  total_slots: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  available_slots: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  price_per_day: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  price_per_month: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  vehicle_types: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['car']
  },
  amenities: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  operating_hours: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: { start: '00:00', end: '23:59' }
  },
  images_url: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  verification_status: {
    type: DataTypes.ENUM(...Object.values(constants.SPACE_VERIFICATION)),
    defaultValue: constants.SPACE_VERIFICATION.PENDING
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
  tableName: 'parking_spaces',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['latitude', 'longitude']
    },
    {
      fields: ['provider_id']
    },
    {
      // PostGIS spatial index for efficient geospatial queries
      fields: sequelize.where(sequelize.fn('ST_GeomFromText', sequelize.col('location')), 'WITH', 4326),
      name: 'idx_location_spatial'
    }
  ]
});

module.exports = ParkingSpace;
