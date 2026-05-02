const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Placeholder routes - implement these controllers next
router.post('/', protect, (req, res) => {
  res.json({ message: 'Create booking - coming soon' });
});

router.get('/:id', protect, (req, res) => {
  res.json({ message: 'Get booking details - coming soon' });
});

router.get('/user/:userId', protect, (req, res) => {
  res.json({ message: 'Get user bookings - coming soon' });
});

router.put('/:id', protect, (req, res) => {
  res.json({ message: 'Modify booking - coming soon' });
});

router.delete('/:id', protect, (req, res) => {
  res.json({ message: 'Cancel booking - coming soon' });
});

router.post('/:id/confirm', protect, (req, res) => {
  res.json({ message: 'Confirm booking - coming soon' });
});

module.exports = router;
