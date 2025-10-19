const User = require('../models/User');
const Issue = require('../models/Issue');

// Get admin's current link information
exports.getAdminLinkInfo = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const admin = await User.findById(adminId).select('adminCode adminSettings firstName lastName email role');
    
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    // Get statistics for this admin's issues
    const issueStats = await Issue.aggregate([
      { $match: { targetAdminId: admin._id } },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIssues = await Issue.countDocuments({ targetAdminId: admin._id });
    const recentIssues = await Issue.find({ targetAdminId: admin._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('societyId', 'name')
      .select('title status priority createdAt societyId');

    const baseUrl = process.env.FRONTEND_URL || 'https://maintainly-alpha.vercel.app';
    const adminLink = `${baseUrl}/report-issue/${admin.adminCode}`;

    res.json({
      status: 'success',
      data: {
        adminCode: admin.adminCode,
        adminLink,
        adminInfo: {
          name: admin.fullName,
          email: admin.email,
          organizationName: admin.adminSettings?.organizationName
        },
        settings: admin.adminSettings,
        stats: {
          totalIssues,
          issuesByStatus: issueStats,
          recentIssues
        }
      }
    });
  } catch (error) {
    console.error('Get admin link info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Generate new admin code
exports.generateNewAdminCode = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    // Generate new code
    const newCode = await User.generateAdminCode();
    admin.adminCode = newCode;
    await admin.save();

    const baseUrl = process.env.FRONTEND_URL || 'https://maintainly-alpha.vercel.app';
    const newAdminLink = `${baseUrl}/report-issue/${newCode}`;

    res.json({
      status: 'success',
      data: {
        adminCode: newCode,
        adminLink: newAdminLink,
        message: 'New admin code generated successfully'
      }
    });
  } catch (error) {
    console.error('Generate admin code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Update admin settings
exports.updateAdminSettings = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { organizationName, customBranding, issueFormSettings } = req.body;
    
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    // Update settings
    if (!admin.adminSettings) {
      admin.adminSettings = {};
    }

    if (organizationName !== undefined) {
      admin.adminSettings.organizationName = organizationName;
    }

    if (customBranding) {
      admin.adminSettings.customBranding = {
        ...admin.adminSettings.customBranding,
        ...customBranding
      };
    }

    if (issueFormSettings) {
      admin.adminSettings.issueFormSettings = {
        ...admin.adminSettings.issueFormSettings,
        ...issueFormSettings
      };
    }

    await admin.save();

    res.json({
      status: 'success',
      data: {
        settings: admin.adminSettings,
        message: 'Admin settings updated successfully'
      }
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get admin info by code (public endpoint for form customization)
exports.getAdminByCode = async (req, res) => {
  try {
    const { adminCode } = req.params;
    
    const admin = await User.findByAdminCode(adminCode)
      .select('firstName lastName adminSettings adminCode');
    
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin not found or inactive'
      });
    }

    res.json({
      status: 'success',
      data: {
        adminCode: admin.adminCode,
        adminInfo: {
          name: admin.fullName,
          organizationName: admin.adminSettings?.organizationName || 'Property Management'
        },
        formSettings: admin.adminSettings?.issueFormSettings || {},
        branding: admin.adminSettings?.customBranding || {}
      }
    });
  } catch (error) {
    console.error('Get admin by code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get admin's issues (filtered view)
exports.getAdminIssues = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { status, priority, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter query - only show issues for this admin
    const filter = { targetAdminId: adminId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortQuery = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get issues
    const issues = await Issue.find(filter)
      .populate('societyId', 'name address')
      .populate('adminReview.reviewedBy', 'firstName lastName')
      .populate('convertedTask.taskId', 'title status')
      .populate('convertedTask.convertedBy', 'firstName lastName')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Issue.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        issues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin issues error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};