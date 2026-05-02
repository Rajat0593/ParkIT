const { sequelize } = require('../config/database');
const ParkingSpace = require('../models/ParkingSpace');
const { geocodeAddressWithFallback } = require('../services/geocodingService');
const logger = require('../utils/logger');

/**
 * ENDPOINT 1: Search nearby parking spaces based on user's current location
 * GET /api/spaces/nearby?latitude=28.5355&longitude=77.2707&radius=5&vehicle_type=car&sort_by=distance&limit=20&skip=0
 */
exports.searchNearby = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, vehicle_type, sort_by = 'distance', limit = 20, skip = 0 } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate and convert parameters to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = Math.min(parseFloat(radius) || 5, 20); // Max 20 km
    const resultLimit = Math.min(parseInt(limit) || 20, 50); // Max 50
    const resultSkip = parseInt(skip) || 0;

    // Determine sort order
    let orderClause = '';
    switch (sort_by) {
      case 'rating':
        orderClause = 'rating DESC, distance ASC';
        break;
      case 'price':
        orderClause = 'price_per_day ASC, distance ASC';
        break;
      case 'availability':
        orderClause = '"available_slots" DESC, distance ASC';
        break;
      case 'distance':
      default:
        orderClause = 'distance ASC';
    }

    // Build vehicle type filter
    let vehicleTypeFilter = '';
    if (vehicle_type) {
      vehicleTypeFilter = `AND "vehicle_types" ? '${vehicle_type}'`;
    }

    // PostGIS query for nearby spaces
    const query = `
      SELECT 
        id,
        name,
        description,
        address,
        latitude,
        longitude,
        total_slots,
        available_slots,
        price_per_day,
        price_per_month,
        vehicle_types,
        amenities,
        rating,
        verification_status,
        is_active,
        ST_Distance(
          ST_GeomFromText('POINT(${lng} ${lat})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
        ) * 111.32 AS distance,
        ROUND((ST_Distance(
          ST_GeomFromText('POINT(${lng} ${lat})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
        ) * 111.32)::numeric, 2) AS distance_km,
        ROUND(((ST_Distance(
          ST_GeomFromText('POINT(${lng} ${lat})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
        ) * 111.32 / 50))::numeric, 0)::INTEGER AS duration_minutes,
        ROUND(
          (
            (111 - (ST_Distance(
              ST_GeomFromText('POINT(${lng} ${lat})', 4326),
              ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
            ) * 111.32 / ${radiusKm})) / 111.0 * 30 +
            ("available_slots"::float / "total_slots" * 25) +
            (rating * 20 / 5) +
            (100 - ("price_per_day" / 10)) * 0.15 +
            10
          )::numeric,
          1
        ) AS relevance_score
      FROM "ParkingSpaces"
      WHERE 
        is_active = true 
        AND available_slots > 0
        AND verification_status = 'verified'
        AND ST_DWithin(
          ST_GeomFromText('POINT(${lng} ${lat})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326),
          ${radiusKm} / 111.32
        )
        ${vehicleTypeFilter}
      ORDER BY ${orderClause}
      LIMIT ${resultLimit} OFFSET ${resultSkip}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM "ParkingSpaces"
      WHERE 
        is_active = true 
        AND available_slots > 0
        AND verification_status = 'verified'
        AND ST_DWithin(
          ST_GeomFromText('POINT(${lng} ${lat})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326),
          ${radiusKm} / 111.32
        )
        ${vehicleTypeFilter}
    `;

    const spaces = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
    const countResult = await sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT });
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      data: spaces.map(space => ({
        _id: space.id,
        name: space.name,
        description: space.description,
        address: space.address,
        distance_km: parseFloat(space.distance_km),
        duration_minutes: parseInt(space.duration_minutes),
        available_spots: space.available_slots,
        total_capacity: space.total_slots,
        rating: parseFloat(space.rating),
        price_per_hour: space.price_per_day ? parseFloat(space.price_per_day) / 24 : 0,
        price_per_day: parseFloat(space.price_per_day),
        amenities: space.amenities || [],
        vehicle_types: space.vehicle_types || [],
        relevance_score: parseFloat(space.relevance_score),
        verified: space.verification_status === 'verified'
      })),
      total,
      limit: resultLimit,
      skip: resultSkip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching nearby spaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching nearby spaces',
      error: error.message
    });
  }
};

/**
 * ENDPOINT 2: Search parking spaces by destination address
 * GET /api/spaces/search-destination?destination=Delhi+Mall&radius=3&vehicle_type=car&limit=20
 */
exports.searchByDestination = async (req, res) => {
  try {
    const { destination, radius = 3, vehicle_type, limit = 20, skip = 0 } = req.query;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination address is required'
      });
    }

    // Geocode the destination address to get coordinates
    let latitude, longitude, geocodedAddress;
    try {
      const geocoded = await geocodeAddressWithFallback(destination);
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
      geocodedAddress = geocoded.formatted_address;
      logger.info(`Geocoded destination: ${destination} -> ${latitude}, ${longitude}`);
    } catch (error) {
      logger.error(`Geocoding failed for destination: ${destination}`, error);
      return res.status(400).json({
        success: false,
        message: 'Could not find location for the destination address',
        error: error.message
      });
    }

    // Now search for nearby spaces using the geocoded coordinates
    const radiusKm = Math.min(parseFloat(radius) || 3, 15); // Max 15 km for destination search
    const resultLimit = Math.min(parseInt(limit) || 20, 50);
    const resultSkip = parseInt(skip) || 0;

    // Build vehicle type filter
    let vehicleTypeFilter = '';
    if (vehicle_type) {
      vehicleTypeFilter = `AND "vehicle_types" ? '${vehicle_type}'`;
    }

    // PostGIS query for nearby spaces
    const query = `
      SELECT 
        id,
        name,
        description,
        address,
        latitude,
        longitude,
        total_slots,
        available_slots,
        price_per_day,
        price_per_month,
        vehicle_types,
        amenities,
        rating,
        verification_status,
        is_active,
        ST_Distance(
          ST_GeomFromText('POINT(${longitude} ${latitude})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
        ) * 111.32 AS distance,
        ROUND((ST_Distance(
          ST_GeomFromText('POINT(${longitude} ${latitude})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
        ) * 111.32)::numeric, 2) AS distance_km,
        ROUND(((ST_Distance(
          ST_GeomFromText('POINT(${longitude} ${latitude})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
        ) * 111.32 / 50))::numeric, 0)::INTEGER AS duration_minutes,
        ROUND(
          (
            (111 - (ST_Distance(
              ST_GeomFromText('POINT(${longitude} ${latitude})', 4326),
              ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326)
            ) * 111.32 / ${radiusKm})) / 111.0 * 30 +
            ("available_slots"::float / "total_slots" * 25) +
            (rating * 20 / 5) +
            (100 - ("price_per_day" / 10)) * 0.15 +
            10
          )::numeric,
          1
        ) AS relevance_score
      FROM "ParkingSpaces"
      WHERE 
        is_active = true 
        AND available_slots > 0
        AND verification_status = 'verified'
        AND ST_DWithin(
          ST_GeomFromText('POINT(${longitude} ${latitude})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326),
          ${radiusKm} / 111.32
        )
        ${vehicleTypeFilter}
      ORDER BY distance_km ASC
      LIMIT ${resultLimit} OFFSET ${resultSkip}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM "ParkingSpaces"
      WHERE 
        is_active = true 
        AND available_slots > 0
        AND verification_status = 'verified'
        AND ST_DWithin(
          ST_GeomFromText('POINT(${longitude} ${latitude})', 4326),
          ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')', 4326),
          ${radiusKm} / 111.32
        )
        ${vehicleTypeFilter}
    `;

    const spaces = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
    const countResult = await sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT });
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      destination: {
        address: geocodedAddress,
        latitude,
        longitude
      },
      data: spaces.map(space => ({
        _id: space.id,
        name: space.name,
        description: space.description,
        address: space.address,
        distance_km: parseFloat(space.distance_km),
        duration_minutes: parseInt(space.duration_minutes),
        available_spots: space.available_slots,
        total_capacity: space.total_slots,
        rating: parseFloat(space.rating),
        price_per_hour: space.price_per_day ? parseFloat(space.price_per_day) / 24 : 0,
        price_per_day: parseFloat(space.price_per_day),
        amenities: space.amenities || [],
        vehicle_types: space.vehicle_types || [],
        relevance_score: parseFloat(space.relevance_score),
        verified: space.verification_status === 'verified'
      })),
      total,
      limit: resultLimit,
      skip: resultSkip,
      radius_km: radiusKm,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching by destination:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching by destination',
      error: error.message
    });
  }
};

/**
 * ENDPOINT 3: Get detailed information about a specific parking space
 * GET /api/spaces/:id/details
 */
exports.getSpaceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Space ID is required'
      });
    }

    const space = await ParkingSpace.findByPk(id, {
      attributes: [
        'id', 'name', 'description', 'address', 'latitude', 'longitude',
        'total_slots', 'available_slots', 'price_per_day', 'price_per_month',
        'vehicle_types', 'amenities', 'operating_hours', 'images_url',
        'rating', 'verification_status', 'created_at', 'updated_at'
      ]
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Parking space not found'
      });
    }

    // In real app, fetch reviews from Review model
    // const reviews = await Review.findAll({ where: { space_id: id } });

    const mockReviews = [
      {
        user: 'John Doe',
        rating: 5,
        comment: 'Great spot! Clean and secure.',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        user: 'Jane Smith',
        rating: 4,
        comment: 'Good location, a bit pricey.',
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        _id: space.id,
        name: space.name,
        description: space.description,
        location: {
          latitude: parseFloat(space.latitude),
          longitude: parseFloat(space.longitude),
          address: space.address
        },
        capacity: space.total_slots,
        available_spots: space.available_slots,
        rating: parseFloat(space.rating),
        reviews_count: mockReviews.length,
        price_per_hour: space.price_per_day ? parseFloat(space.price_per_day) / 24 : 0,
        price_per_day: parseFloat(space.price_per_day),
        price_per_month: space.price_per_month ? parseFloat(space.price_per_month) : null,
        amenities: space.amenities || [],
        vehicle_types: space.vehicle_types || [],
        operating_hours: space.operating_hours,
        images: space.images_url || [],
        verified: space.verification_status === 'verified',
        reviews: mockReviews,
        directions: {
          route_url: `https://www.google.com/maps?q=${space.latitude},${space.longitude}`,
          google_maps_url: `https://maps.google.com/?q=${space.latitude},${space.longitude}`
        },
        created_at: space.created_at,
        updated_at: space.updated_at
      }
    });
  } catch (error) {
    logger.error('Error fetching space details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching space details',
      error: error.message
    });
  }
};

/**
 * ENDPOINT 4: Get trending/popular parking spaces
 * GET /api/spaces/trending?limit=10&period=week
 */
exports.getTrendingSpaces = async (req, res) => {
  try {
    const { limit = 10, period = 'week' } = req.query;

    const resultLimit = Math.min(parseInt(limit) || 10, 50);

    // Determine the date range based on period
    let dateFilter = '';
    const now = new Date();
    switch (period) {
      case 'today':
        dateFilter = `AND "createdAt" >= NOW() - INTERVAL '1 day'`;
        break;
      case 'week':
        dateFilter = `AND "createdAt" >= NOW() - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `AND "createdAt" >= NOW() - INTERVAL '30 days'`;
        break;
      default:
        dateFilter = `AND "createdAt" >= NOW() - INTERVAL '7 days'`;
    }

    // Query for trending spaces based on bookings count and rating
    // This assumes a Booking model exists
    const query = `
      SELECT 
        ps.id,
        ps.name,
        ps.description,
        ps.address,
        ps.latitude,
        ps.longitude,
        ps.rating,
        ps.verification_status,
        ps.is_active,
        COUNT(b.id) as bookings_count,
        COALESCE(AVG(b.rating), ps.rating) as average_rating
      FROM "ParkingSpaces" ps
      LEFT JOIN "Bookings" b ON ps.id = b."spaceId" ${dateFilter}
      WHERE ps.is_active = true
      GROUP BY ps.id
      ORDER BY bookings_count DESC, average_rating DESC
      LIMIT ${resultLimit}
    `;

    // Fallback query in case Bookings table doesn't exist
    const fallbackQuery = `
      SELECT 
        id,
        name,
        description,
        address,
        latitude,
        longitude,
        rating,
        verification_status,
        is_active,
        0 as bookings_count
      FROM "ParkingSpaces"
      WHERE is_active = true
      ORDER BY rating DESC
      LIMIT ${resultLimit}
    `;

    let spaces;
    try {
      spaces = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
    } catch (err) {
      logger.warn('Bookings table not found, using fallback query');
      spaces = await sequelize.query(fallbackQuery, { type: sequelize.QueryTypes.SELECT });
    }

    return res.status(200).json({
      success: true,
      data: spaces.map(space => ({
        _id: space.id,
        name: space.name,
        description: space.description,
        address: space.address,
        location: {
          latitude: parseFloat(space.latitude),
          longitude: parseFloat(space.longitude)
        },
        bookings_count: parseInt(space.bookings_count) || 0,
        average_rating: parseFloat(space.average_rating || space.rating),
        rating: parseFloat(space.rating),
        verified: space.verification_status === 'verified'
      })),
      period,
      limit: resultLimit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching trending spaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching trending spaces',
      error: error.message
    });
  }
};

/**
 * Get all parking spaces (with pagination)
 * GET /api/spaces?limit=20&skip=0&active=true
 */
exports.getAllSpaces = async (req, res) => {
  try {
    const { limit = 20, skip = 0, active = true } = req.query;

    const resultLimit = Math.min(parseInt(limit) || 20, 50);
    const resultSkip = parseInt(skip) || 0;

    const spaces = await ParkingSpace.findAll({
      where: active === 'true' ? { is_active: true } : {},
      limit: resultLimit,
      offset: resultSkip,
      attributes: [
        'id', 'name', 'address', 'latitude', 'longitude',
        'available_slots', 'total_slots', 'rating', 'price_per_day',
        'verification_status', 'is_active'
      ],
      order: [['rating', 'DESC']]
    });

    const total = await ParkingSpace.count({
      where: active === 'true' ? { is_active: true } : {}
    });

    return res.status(200).json({
      success: true,
      data: spaces.map(space => ({
        _id: space.id,
        name: space.name,
        address: space.address,
        location: {
          latitude: parseFloat(space.latitude),
          longitude: parseFloat(space.longitude)
        },
        available_spots: space.available_slots,
        total_capacity: space.total_slots,
        rating: parseFloat(space.rating),
        price_per_day: parseFloat(space.price_per_day),
        verified: space.verification_status === 'verified'
      })),
      total,
      limit: resultLimit,
      skip: resultSkip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching all spaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching spaces',
      error: error.message
    });
  }
};
