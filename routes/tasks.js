const express = require('express');
const multer = require('multer');
const { body, param, query } = require('express-validator');
const tasksController = require('../controllers/tasksController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrManager, requireResourceOwnership } = require('../middleware/roleMiddleware');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload details:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Accept if mimetype starts with 'image/' or if originalname has image extension
    const isImageMimeType = file.mimetype && file.mimetype.startsWith('image/');
    const hasImageExtension = file.originalname && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.originalname);
    
    if (isImageMimeType || hasImageExtension) {
      cb(null, true);
    } else {
      console.log('File rejected - not an image:', { mimetype: file.mimetype, originalname: file.originalname });
      cb(new Error(`Only image files are allowed. Received: ${file.mimetype || 'unknown mimetype'}`), false);
    }
  }
});

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/tasks
 * @desc    Get tasks (Admins see all their tasks, Managers see their assigned tasks)
 * @access  Private (Admin/Manager)
 */
router.get('/', [
  requireAdminOrManager,
  requireResourceOwnership,
  query('status')
    .optional()
    .isIn(['Pending', 'InProgress', 'PendingVerification', 'Completed', 'RequiresAttention'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid society ID'),
  query('assetId')
    .optional()
    .isMongoId()
    .withMessage('Invalid asset ID')
], tasksController.getTasks);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private (Admin/Manager)
 */
router.get('/:id', [
  requireAdminOrManager,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid task ID')
], tasksController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private (Admin)
 */
router.post('/', [
  requireAdmin,
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Task title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Task description must be between 10 and 1000 characters'),
  body('assetId')
    .isMongoId()
    .withMessage('Invalid asset ID'),
  body('assignedManagerId')
    .isMongoId()
    .withMessage('Invalid manager ID'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid scheduled date'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 15, max: 1440 })
    .withMessage('Estimated duration must be between 15 and 1440 minutes')
], tasksController.createTask);

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Update task (general edits by Admin)
 * @access  Private (Admin)
 */
router.patch('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Task title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Task description must be between 10 and 1000 characters'),
  body('assignedManagerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid manager ID'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 15, max: 1440 })
    .withMessage('Estimated duration must be between 15 and 1440 minutes'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
], tasksController.updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Admin)
 */
router.delete('/:id', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid task ID')
], tasksController.deleteTask);

/**
 * @route   POST /api/tasks/:id/start
 * @desc    Start working on a task (Manager changes status to InProgress)
 * @access  Private (Manager - must be assigned to this task)
 */
router.post('/:id/start', [
  requireAdminOrManager,
  param('id').isMongoId().withMessage('Invalid task ID')
], tasksController.startTask);

/**
 * @route   POST /api/tasks/:id/upload-photo
 * @desc    Upload task completion photo
 * @access  Private (Manager - must be assigned to this task)
 */
router.post('/:id/upload-photo', [
  requireAdminOrManager,
  param('id').isMongoId().withMessage('Invalid task ID'),
  upload.single('photo')
], tasksController.uploadTaskPhoto);

/**
 * @route   POST /api/tasks/:id/submit-for-verification
 * @desc    Submit task for verification with photo
 * @access  Private (Manager - must be assigned to this task)
 */
router.post('/:id/submit-for-verification', [
  requireAdminOrManager,
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('photoUrl')
    .isURL()
    .withMessage('Valid photo URL is required'),
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Completion notes cannot exceed 1000 characters')
], tasksController.submitForVerification);

/**
 * @route   POST /api/tasks/:id/verify
 * @desc    Verify task completion (Admin approves or rejects)
 * @access  Private (Admin)
 */
router.post('/:id/verify', [
  requireAdmin,
  requireResourceOwnership,
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  body('verificationNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Verification notes cannot exceed 1000 characters'),
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason is required and must be between 5 and 500 characters')
], tasksController.verifyTask);

/**
 * @route   GET /api/tasks/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin/Manager)
 */
router.get('/dashboard/stats', [
  requireAdminOrManager,
  requireResourceOwnership
], tasksController.getDashboardStats);

/**
 * @route   POST /api/tasks/upload-url
 * @desc    Generate signed URL for photo upload
 * @access  Private (Manager)
 */
router.post('/upload-url', [
  requireAdminOrManager,
  body('fileName')
    .trim()
    .notEmpty()
    .withMessage('File name is required'),
  body('fileType')
    .optional()
    .isIn(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
    .withMessage('Invalid file type. Only JPEG, PNG, and WebP images are allowed')
], tasksController.generateUploadUrl);

module.exports = router;