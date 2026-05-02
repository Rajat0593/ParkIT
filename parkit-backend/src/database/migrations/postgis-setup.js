/**
 * PostGIS Setup and Database Indexes Migration
 * 
 * This file contains SQL commands for setting up PostGIS and creating indexes
 * for the geospatial location-based parking search feature.
 * 
 * Prerequisites:
 * - PostgreSQL 9.5+
 * - PostGIS extension (install via: CREATE EXTENSION postgis;)
 */

// ============================================================================
// STEP 1: Enable PostGIS Extension
// ============================================================================
// Run this SQL command in your PostgreSQL database:
// CREATE EXTENSION IF NOT EXISTS postgis;

// Verify PostGIS is installed:
// SELECT PostGIS_version();

// ============================================================================
// STEP 2: Update ParkingSpaces Table (if not using ORM auto-sync)
// ============================================================================
// Add location column if it doesn't exist:
// ALTER TABLE "ParkingSpaces"
// ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

// ============================================================================
// STEP 3: Create Geospatial Indexes
// ============================================================================
// Create GIST index for efficient geospatial queries (search nearby):
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_location_gist
// ON "ParkingSpaces" USING GIST (location);

// Create compound index for common query patterns:
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_location_availability
// ON "ParkingSpaces" USING GIST (location)
// WHERE "available_slots" > 0 AND "is_active" = true;

// Create BRIN index (good for large tables):
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_location_brin
// ON "ParkingSpaces" USING BRIN (location);

// ============================================================================
// STEP 4: Create Indexes for Query Filters
// ============================================================================
// Index for active spaces (used in WHERE clause):
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_active
// ON "ParkingSpaces"("is_active");

// Index for verification status:
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_verification
// ON "ParkingSpaces"("verification_status")
// WHERE "is_active" = true;

// Index for available slots:
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_available_slots
// ON "ParkingSpaces"("available_slots" DESC)
// WHERE "available_slots" > 0;

// Composite index for vehicle type filtering:
// CREATE INDEX IF NOT EXISTS idx_parking_spaces_vehicle_types
// ON "ParkingSpaces" USING GIN ("vehicle_types");

// ============================================================================
// STEP 5: Populate Location Geometry from Lat/Lng (One-time)
// ============================================================================
// Update existing records with location geometry:
// UPDATE "ParkingSpaces"
// SET location = ST_GeomFromText(
//   'POINT(' || "longitude" || ' ' || "latitude" || ')',
//   4326
// )
// WHERE location IS NULL AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

// ============================================================================
// STEP 6: Create Trigger for Automatic Location Update
// ============================================================================
// This trigger automatically updates the location column when lat/lng change:

/*
CREATE OR REPLACE FUNCTION update_parking_space_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."latitude" IS NOT NULL AND NEW."longitude" IS NOT NULL THEN
    NEW.location := ST_GeomFromText(
      'POINT(' || NEW."longitude" || ' ' || NEW."latitude" || ')',
      4326
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parking_space_location_update ON "ParkingSpaces";
CREATE TRIGGER parking_space_location_update
  BEFORE INSERT OR UPDATE ON "ParkingSpaces"
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_space_location();
*/

// ============================================================================
// STEP 7: PostGIS Queries Reference
// ============================================================================

/**
 * Query 1: Find parking spaces within a radius
 * 
 * Parameters:
 * - user_lat: User's latitude (e.g., 28.5355)
 * - user_lng: User's longitude (e.g., 77.2707)
 * - radius_km: Search radius in kilometers (e.g., 5)
 * 
 * Returns: List of parking spaces sorted by distance
 */
const findNearbySpaces = `
  SELECT 
    id,
    name,
    address,
    available_slots,
    rating,
    price_per_day,
    ST_Distance(
      ST_GeomFromText('POINT(:user_lng :user_lat)', 4326),
      location
    ) * 111.32 AS distance_km
  FROM "ParkingSpaces"
  WHERE 
    is_active = true
    AND available_slots > 0
    AND ST_DWithin(
      location,
      ST_GeomFromText('POINT(:user_lng :user_lat)', 4326),
      :radius_km / 111.32
    )
  ORDER BY distance_km ASC;
`;

/**
 * Query 2: Find parking spaces within a bounding box
 * (More efficient than radial queries for large areas)
 * 
 * Parameters:
 * - min_lat, max_lat, min_lng, max_lng: Bounding box coordinates
 */
const findSpacesInBoundingBox = `
  SELECT 
    id,
    name,
    address,
    available_slots,
    rating,
    ST_Distance(location, ST_GeomFromText('POINT(:center_lng :center_lat)', 4326)) * 111.32 AS distance_km
  FROM "ParkingSpaces"
  WHERE 
    is_active = true
    AND location && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)
  ORDER BY distance_km ASC;
`;

/**
 * Query 3: Calculate distance and bearing between two points
 */
const calculateDistance = `
  SELECT 
    ST_Distance(
      location,
      ST_GeomFromText('POINT(:dest_lng :dest_lat)', 4326)
    ) * 111.32 AS distance_km,
    ST_Azimuth(
      location,
      ST_GeomFromText('POINT(:dest_lng :dest_lat)', 4326)
    ) * 180 / PI() AS bearing_degrees
  FROM "ParkingSpaces"
  WHERE id = :space_id;
`;

/**
 * Query 4: Find nearest parking space
 */
const findNearestSpace = `
  SELECT 
    id,
    name,
    address,
    ST_Distance(location, ST_GeomFromText('POINT(:user_lng :user_lat)', 4326)) * 111.32 AS distance_km
  FROM "ParkingSpaces"
  WHERE is_active = true AND available_slots > 0
  ORDER BY location <-> ST_GeomFromText('POINT(:user_lng :user_lat)', 4326)
  LIMIT 1;
`;

/**
 * Query 5: Count spaces within radius (heat map data)
 */
const countSpacesWithinRadius = `
  SELECT 
    COUNT(*) as total_spaces,
    SUM(CASE WHEN available_slots > 0 THEN 1 ELSE 0 END) as available_count,
    AVG(rating) as avg_rating
  FROM "ParkingSpaces"
  WHERE 
    is_active = true
    AND ST_DWithin(
      location,
      ST_GeomFromText('POINT(:lng :lat)', 4326),
      :radius_km / 111.32
    );
`;

// ============================================================================
// STEP 8: Performance Tips
// ============================================================================
// 1. Use ST_DWithin instead of ST_Distance for filtering (index-aware)
// 2. Always specify SRID (4326 is standard for lat/lng)
// 3. Use <-> operator for nearest neighbor searches
// 4. Create separate indexes on common filter columns (active, verification)
// 5. Use EXPLAIN ANALYZE to check query plans
// 6. For very large datasets, consider partitioning by geography
// 7. Use ST_MakeEnvelope for bounding box queries (more efficient)

// ============================================================================
// VERIFICATION COMMANDS
// ============================================================================
// Verify all indexes are created:
// SELECT indexname FROM pg_indexes 
// WHERE tablename = 'ParkingSpaces' 
// ORDER BY indexname;

// Check index usage:
// SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
// FROM pg_stat_user_indexes
// WHERE tablename = 'ParkingSpaces';

// Check for unused indexes:
// SELECT schemaname, tablename, indexname, idx_scan
// FROM pg_stat_user_indexes
// WHERE tablename = 'ParkingSpaces' AND idx_scan = 0;

module.exports = {
  setupInstructions: `
    1. Ensure PostGIS is installed: CREATE EXTENSION IF NOT EXISTS postgis;
    2. Run SQL commands from this file in order
    3. Update existing records with location geometry
    4. Create trigger for automatic location updates
    5. Test queries with sample data
  `,
  queries: {
    findNearbySpaces,
    findSpacesInBoundingBox,
    calculateDistance,
    findNearestSpace,
    countSpacesWithinRadius
  }
};
