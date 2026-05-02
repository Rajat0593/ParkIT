const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Placeholder routes - implement these controllers next
router.post('/', protect, (req, res) => {
  res.json({ message: 'Add vehicle - coming soon' });
});

router.get('/:id', protect, (req, res) => {
  res.json({ message: 'Get vehicle details - coming soon' });
});

router.put('/:id', protect, (req, res) => {
  res.json({ message: 'Update vehicle - coming soon' });
});

router.delete('/:id', protect, (req, res) => {
  res.json({ message: 'Delete vehicle - coming soon' });
});

module.exports = router;
