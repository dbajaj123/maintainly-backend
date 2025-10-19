const express = require('express');
const router = express.Router();
const adminLinksController = require('../controllers/adminLinksController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Public route - get admin info by code (for form customization)
router.get('/admin/:adminCode', adminLinksController.getAdminByCode);

// Protected routes - require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// Debug endpoint to check current user
router.get('/debug-user', (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user,
      headers: req.headers.authorization ? 'Token present' : 'No token',
    }
  });
});

// Get current admin's link information and stats
router.get('/my-link', adminLinksController.getAdminLinkInfo);

// Generate new admin code
router.post('/generate-code', adminLinksController.generateNewAdminCode);

// Update admin settings
router.patch('/settings', adminLinksController.updateAdminSettings);

// Get admin's specific issues
router.get('/my-issues', adminLinksController.getAdminIssues);

module.exports = router;