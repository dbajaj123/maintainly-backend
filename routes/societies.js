const express = require('express');
const { body, param } = require('express-validator');
const societiesController = require('../controllers/societiesController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireResourceOwnership } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/societies
 * @desc    Get all societies for the current admin
 * @access  Private (Admin)
 */
router.get('/', [
  requireAdmin,
  requireResourceOwnership
], societiesController.getSocieties);

/**
 * @route   GET /api/societies/:id
 * @desc    Get society by ID
 * @access  Private (Admin)
 */
router.get('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid society ID')
], societiesController.getSocietyById);

/**
 * @route   POST /api/societies
 * @desc    Create new society
 * @access  Private (Admin)
 */
router.post('/', [
  requireAdmin,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Society name must be between 2 and 100 characters'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('address.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('totalUnits')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total units must be a positive integer'),
  body('contactInfo.primaryContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Primary contact name cannot exceed 100 characters'),
  body('contactInfo.primaryContact.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid primary contact phone number'),
  body('contactInfo.primaryContact.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid primary contact email'),
  body('contactInfo.emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),
  body('contactInfo.emergencyContact.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid emergency contact phone number'),
  body('contactInfo.emergencyContact.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid emergency contact email')
], societiesController.createSociety);

/**
 * @route   PUT /api/societies/:id
 * @desc    Update society
 * @access  Private (Admin)
 */
router.put('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid society ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Society name must be between 2 and 100 characters'),
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address cannot be empty'),
  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('address.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  body('address.zipCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Zip code cannot be empty'),
  body('address.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('totalUnits')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total units must be a positive integer'),
  body('contactInfo.primaryContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Primary contact name cannot exceed 100 characters'),
  body('contactInfo.primaryContact.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid primary contact phone number'),
  body('contactInfo.primaryContact.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid primary contact email'),
  body('contactInfo.emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),
  body('contactInfo.emergencyContact.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid emergency contact phone number'),
  body('contactInfo.emergencyContact.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid emergency contact email')
], societiesController.updateSociety);

/**
 * @route   DELETE /api/societies/:id
 * @desc    Delete society (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid society ID')
], societiesController.deleteSociety);

module.exports = router;