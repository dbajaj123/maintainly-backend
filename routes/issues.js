const express = require('express');
const router = express.Router();
const issuesController = require('../controllers/issuesController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Public routes (for residents - no authentication required)
router.post('/submit', issuesController.submitIssue);
router.get('/societies', issuesController.getSocietiesForForm);
router.get('/db-status', issuesController.getDbStatus);

// Protected routes (admin only)
router.use(authMiddleware); // All routes below require authentication

// Admin routes
router.get('/', requireAdmin, issuesController.getAllIssues);
router.get('/stats', requireAdmin, issuesController.getIssueStats);
router.get('/:id', requireAdmin, issuesController.getIssueById);
router.patch('/:id/review', requireAdmin, issuesController.reviewIssue);
router.post('/:id/convert-to-task', requireAdmin, issuesController.convertToTask);

module.exports = router;