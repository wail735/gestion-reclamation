const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/statsController');

router.route('/').get(protect, admin, getDashboardStats);

module.exports = router;
