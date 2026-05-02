/**
 * Parking Space Ranking Algorithm
 * 
 * Score = (Distance_Score × 0.30) +
 *         (Availability_Score × 0.25) +
 *         (Rating_Score × 0.20) +
 *         (Price_Score × 0.15) +
 *         (Type_Match_Score × 0.10)
 */

const WEIGHTS = {
  distance: 0.30,
  availability: 0.25,
  rating: 0.20,
  price: 0.15,
  typeMatch: 0.10,
};

/**
 * Calculate distance score (closer is better)
 * Max distance: 20km, Score: 0-100
 */
function calculateDistanceScore(distanceKm, maxDistanceKm = 20) {
  const normalizedDistance = Math.min(distanceKm / maxDistanceKm, 1);
  return Math.max(100 - normalizedDistance * 100, 0);
}

/**
 * Calculate availability score
 * Score: 0-100 based on percentage of available spots
 */
function calculateAvailabilityScore(availableSpots, totalSpots) {
  if (totalSpots === 0) return 0;
  return (availableSpots / totalSpots) * 100;
}

/**
 * Calculate rating score
 * Max rating: 5 stars, Score: 0-100
 */
function calculateRatingScore(rating, maxRating = 5) {
  return (rating / maxRating) * 100;
}

/**
 * Calculate price score (lower price is better)
 * Normalized to 0-100 scale
 */
function calculatePriceScore(pricePerDay, maxPricePerDay = 500) {
  const normalizedPrice = Math.min(pricePerDay / maxPricePerDay, 1);
  return Math.max(100 - normalizedPrice * 100, 0);
}

/**
 * Calculate vehicle type match score
 * Score: 100 if exact match, 50 if partial, 0 if no match
 */
function calculateTypeMatchScore(userVehicleType, allowedTypes) {
  if (!allowedTypes || allowedTypes.length === 0) return 50; // Neutral score
  
  if (userVehicleType === 'all') return 100; // Accept any type
  
  if (allowedTypes.includes(userVehicleType)) return 100; // Exact match
  
  if (allowedTypes.includes('car') && userVehicleType === 'bike') return 50; // Partial
  
  return 0; // No match
}

/**
 * Main ranking function
 * Takes a space object and returns a score (0-100)
 */
export function calculateSpaceScore(space, userFilters = {}) {
  const {
    distanceKm = 5,
    maxDistanceKm = 20,
    userVehicleType = 'all',
    maxPricePerDay = 500,
  } = userFilters;

  // Calculate individual scores
  const distanceScore = calculateDistanceScore(distanceKm, maxDistanceKm);
  const availabilityScore = calculateAvailabilityScore(
    space.available_spots || space.available_slots,
    space.total_capacity || space.total_slots
  );
  const ratingScore = calculateRatingScore(space.rating || 0);
  const priceScore = calculatePriceScore(space.price_per_day || 0, maxPricePerDay);
  const typeMatchScore = calculateTypeMatchScore(
    userVehicleType,
    space.vehicle_types || []
  );

  // Calculate weighted total score
  const totalScore =
    distanceScore * WEIGHTS.distance +
    availabilityScore * WEIGHTS.availability +
    ratingScore * WEIGHTS.rating +
    priceScore * WEIGHTS.price +
    typeMatchScore * WEIGHTS.typeMatch;

  return Math.round(totalScore * 10) / 10; // Round to 1 decimal place
}

/**
 * Rank multiple spaces and return sorted by score
 */
export function rankSpaces(spaces, userFilters = {}) {
  if (!spaces || spaces.length === 0) return [];

  const rankedSpaces = spaces.map((space) => ({
    ...space,
    relevance_score: calculateSpaceScore(space, userFilters),
  }));

  return rankedSpaces.sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Get recommended spaces (top N)
 */
export function getRecommendedSpaces(spaces, limit = 5, userFilters = {}) {
  return rankSpaces(spaces, userFilters).slice(0, limit);
}

/**
 * Filter spaces by criteria
 */
export function filterSpaces(spaces, criteria = {}) {
  const {
    minAvailability = 0,
    minRating = 0,
    maxPrice = Infinity,
    vehicleTypes = [],
  } = criteria;

  return spaces.filter((space) => {
    const availableSpots = space.available_spots || space.available_slots || 0;
    const totalSpots = space.total_capacity || space.total_slots || 1;
    const availabilityPercent = (availableSpots / totalSpots) * 100;

    const hasMinAvailability = availabilityPercent >= minAvailability;
    const hasMinRating = (space.rating || 0) >= minRating;
    const withinBudget = (space.price_per_day || 0) <= maxPrice;
    const hasVehicleType =
      vehicleTypes.length === 0 ||
      vehicleTypes.some((type) =>
        (space.vehicle_types || []).includes(type)
      );

    return (
      hasMinAvailability && hasMinRating && withinBudget && hasVehicleType
    );
  });
}

/**
 * Sort spaces by criteria
 */
export function sortSpaces(spaces, sortBy = 'relevance_score', order = 'desc') {
  const sorted = [...spaces].sort((a, b) => {
    const aValue = a[sortBy] ?? 0;
    const bValue = b[sortBy] ?? 0;

    if (order === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  return sorted;
}

/**
 * Get scoring breakdown for a space (for debugging/UI display)
 */
export function getScoreBreakdown(space, userFilters = {}) {
  const {
    distanceKm = 5,
    maxDistanceKm = 20,
    userVehicleType = 'all',
    maxPricePerDay = 500,
  } = userFilters;

  const distanceScore = calculateDistanceScore(distanceKm, maxDistanceKm);
  const availabilityScore = calculateAvailabilityScore(
    space.available_spots || space.available_slots,
    space.total_capacity || space.total_slots
  );
  const ratingScore = calculateRatingScore(space.rating || 0);
  const priceScore = calculatePriceScore(space.price_per_day || 0, maxPricePerDay);
  const typeMatchScore = calculateTypeMatchScore(
    userVehicleType,
    space.vehicle_types || []
  );

  return {
    distance: {
      score: Math.round(distanceScore),
      weight: WEIGHTS.distance,
      contribution: Math.round(distanceScore * WEIGHTS.distance),
    },
    availability: {
      score: Math.round(availabilityScore),
      weight: WEIGHTS.availability,
      contribution: Math.round(availabilityScore * WEIGHTS.availability),
    },
    rating: {
      score: Math.round(ratingScore),
      weight: WEIGHTS.rating,
      contribution: Math.round(ratingScore * WEIGHTS.rating),
    },
    price: {
      score: Math.round(priceScore),
      weight: WEIGHTS.price,
      contribution: Math.round(priceScore * WEIGHTS.price),
    },
    typeMatch: {
      score: Math.round(typeMatchScore),
      weight: WEIGHTS.typeMatch,
      contribution: Math.round(typeMatchScore * WEIGHTS.typeMatch),
    },
  };
}

export default {
  calculateSpaceScore,
  rankSpaces,
  getRecommendedSpaces,
  filterSpaces,
  sortSpaces,
  getScoreBreakdown,
  WEIGHTS,
};
