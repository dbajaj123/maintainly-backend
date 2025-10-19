const express = require('express');
const { body, param, query } = require('express-validator');
const assetsController = require('../controllers/assetsController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrManager, requireResourceOwnership } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/assets
 * @desc    Get all assets for the current admin (optionally filtered by society)
 * @access  Private (Admin/Manager)
 */
router.get('/', [
  requireAdminOrManager,
  requireResourceOwnership,
  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid society ID')
], assetsController.getAssets);

/**
 * @route   GET /api/assets/:id
 * @desc    Get asset by ID
 * @access  Private (Admin/Manager)
 */
router.get('/:id', [
  requireAdminOrManager,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid asset ID')
], assetsController.getAssetById);

/**
 * @route   POST /api/assets
 * @desc    Create new asset
 * @access  Private (Admin)
 */
router.post('/', [
  requireAdmin,
  requireResourceOwnership,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Asset name must be between 2 and 100 characters'),
  body('assetLibraryItemId')
    .isMongoId()
    .withMessage('Invalid asset library item ID'),
  body('societyId')
    .isMongoId()
    .withMessage('Invalid society ID'),
  body('location.building')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Building cannot exceed 100 characters'),
  body('location.floor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Floor cannot exceed 50 characters'),
  body('location.room')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Room cannot exceed 100 characters'),
  body('location.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location description cannot exceed 200 characters'),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Serial number cannot exceed 100 characters'),
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manufacturer cannot exceed 100 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model cannot exceed 100 characters'),
  body('installationDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid installation date'),
  body('warrantyExpiry')
    .optional()
    .isISO8601()
    .withMessage('Invalid warranty expiry date'),
  body('condition')
    .optional()
    .isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service'])
    .withMessage('Invalid condition'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], assetsController.createAsset);

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset
 * @access  Private (Admin)
 */
router.put('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid asset ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Asset name must be between 2 and 100 characters'),
  body('location.building')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Building cannot exceed 100 characters'),
  body('location.floor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Floor cannot exceed 50 characters'),
  body('location.room')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Room cannot exceed 100 characters'),
  body('location.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location description cannot exceed 200 characters'),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Serial number cannot exceed 100 characters'),
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manufacturer cannot exceed 100 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model cannot exceed 100 characters'),
  body('installationDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid installation date'),
  body('warrantyExpiry')
    .optional()
    .isISO8601()
    .withMessage('Invalid warranty expiry date'),
  body('condition')
    .optional()
    .isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service'])
    .withMessage('Invalid condition'),
  body('lastMaintenanceDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid last maintenance date'),
  body('nextMaintenanceDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid next maintenance date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], assetsController.updateAsset);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete asset (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid asset ID')
], assetsController.deleteAsset);

module.exports = router;