const express = require('express');
const { body, param } = require('express-validator');
const assetLibraryController = require('../controllers/assetLibraryController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireResourceOwnership } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/asset-library
 * @desc    Get all asset library items for the current admin
 * @access  Private (Admin)
 */
router.get('/', [
  requireAdmin,
  requireResourceOwnership
], assetLibraryController.getAssetLibraryItems);

/**
 * @route   GET /api/asset-library/:id
 * @desc    Get asset library item by ID
 * @access  Private (Admin)
 */
router.get('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid asset library item ID')
], assetLibraryController.getAssetLibraryItemById);

/**
 * @route   POST /api/asset-library
 * @desc    Create new asset library item
 * @access  Private (Admin)
 */
router.post('/', [
  requireAdmin,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Asset name must be between 2 and 100 characters'),
  body('category')
    .isIn(['Electrical', 'Plumbing', 'HVAC', 'Security', 'Landscaping', 'Structural', 'Cleaning', 'Fire Safety', 'Elevator', 'Generator', 'Water System', 'Waste Management', 'Other'])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('maintenanceFrequency')
    .optional()
    .isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'])
    .withMessage('Invalid maintenance frequency'),
  body('estimatedCost.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum cost must be a positive number'),
  body('estimatedCost.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum cost must be a positive number'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('safetyRequirements')
    .optional()
    .isArray()
    .withMessage('Safety requirements must be an array')
], assetLibraryController.createAssetLibraryItem);

/**
 * @route   PUT /api/asset-library/:id
 * @desc    Update asset library item
 * @access  Private (Admin)
 */
router.put('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid asset library item ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Asset name must be between 2 and 100 characters'),
  body('category')
    .optional()
    .isIn(['Electrical', 'Plumbing', 'HVAC', 'Security', 'Landscaping', 'Structural', 'Cleaning', 'Fire Safety', 'Elevator', 'Generator', 'Water System', 'Waste Management', 'Other'])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('maintenanceFrequency')
    .optional()
    .isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'])
    .withMessage('Invalid maintenance frequency'),
  body('estimatedCost.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum cost must be a positive number'),
  body('estimatedCost.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum cost must be a positive number'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('safetyRequirements')
    .optional()
    .isArray()
    .withMessage('Safety requirements must be an array')
], assetLibraryController.updateAssetLibraryItem);

/**
 * @route   DELETE /api/asset-library/:id
 * @desc    Delete asset library item (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid asset library item ID')
], assetLibraryController.deleteAssetLibraryItem);

module.exports = router;