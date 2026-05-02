const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  searchNearby,
  searchByDestination,
  getSpaceDetails,
  getTrendingSpaces,
  getAllSpaces
} = require('../controllers/spaceController');

const router = express.Router();

// Search endpoints
/**
 * GET /api/spaces/nearby?latitude=28.5355&longitude=77.2707&radius=5&vehicle_type=car&sort_by=distance&limit=20
 * Search for parking spaces near a user's current location
 */
router.get('/search/nearby', searchNearby);

/**
 * GET /api/spaces/search/destination?destination=Delhi+Mall&radius=3&vehicle_type=car&limit=20
 * Search for parking spaces near a destination address
 */
router.get('/search/destination', searchByDestination);

/**
 * GET /api/spaces/trending?limit=10&period=week
 * Get trending/popular parking spaces
 */
router.get('/trending', getTrendingSpaces);

/**
 * GET /api/spaces/:id/details
 * Get detailed information about a specific parking space
 */
router.get('/:id/details', getSpaceDetails);

/**
 * GET /api/spaces?limit=20&skip=0&active=true
 * Get all parking spaces with pagination
 */
router.get('/', getAllSpaces);

/**
 * POST /api/spaces
 * Create a new parking space (space provider only)
 */
router.post('/', protect, authorize('space_provider'), (req, res) => {
  res.json({ message: 'Create parking space - coming soon' });
});

/**
 * PUT /api/spaces/:id
 * Update a parking space (space provider only)
 */
router.put('/:id', protect, authorize('space_provider'), (req, res) => {
  res.json({ message: 'Update parking space - coming soon' });
});

/**
 * DELETE /api/spaces/:id
 * Delete a parking space (space provider only)
 */
router.delete('/:id', protect, authorize('space_provider'), (req, res) => {
  res.json({ message: 'Delete parking space - coming soon' });
});

module.exports = router;
