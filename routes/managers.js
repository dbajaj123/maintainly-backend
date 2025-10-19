const express = require('express');
const { body } = require('express-validator');
const managersController = require('../controllers/managersController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply admin requirement to all routes
router.use(requireAdmin);

/**
 * @route   GET /api/managers/stats
 * @desc    Get manager statistics
 * @access  Private (Admin only)
 */
router.get('/stats', managersController.getManagerStats);

/**
 * @route   GET /api/managers
 * @desc    Get all managers with pagination and search
 * @access  Private (Admin only)
 */
router.get('/', managersController.getManagers);

/**
 * @route   POST /api/managers
 * @desc    Create new manager
 * @access  Private (Admin only)
 */
router.post('/', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
], managersController.createManager);

/**
 * @route   GET /api/managers/:id
 * @desc    Get single manager by ID
 * @access  Private (Admin only)
 */
router.get('/:id', managersController.getManager);

/**
 * @route   PUT /api/managers/:id
 * @desc    Update manager
 * @access  Private (Admin only)
 */
router.put('/:id', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
], managersController.updateManager);

/**
 * @route   DELETE /api/managers/:id
 * @desc    Delete (deactivate) manager
 * @access  Private (Admin only)
 */
router.delete('/:id', managersController.deleteManager);

/**
 * @route   POST /api/managers/:id/reset-password
 * @desc    Reset manager password
 * @access  Private (Admin only)
 */
router.post('/:id/reset-password', [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], managersController.resetManagerPassword);

module.exports = router;