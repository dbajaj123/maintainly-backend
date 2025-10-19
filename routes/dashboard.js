const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard overview data
 * @access  Private (Admin/Manager)
 */
router.get('/', authMiddleware, dashboardController.getDashboard);

module.exports = router;