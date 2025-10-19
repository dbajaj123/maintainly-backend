const Issue = require('../models/Issue');
const Task = require('../models/Task');
const Society = require('../models/Society');
const Asset = require('../models/Asset');
const User = require('../models/User');

// Public endpoints for residents (no authentication required)

// Submit a new issue (public endpoint)
exports.submitIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      societyId,
      residentInfo,
      location,
      urgencyLevel,
      adminCode
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !societyId || !residentInfo) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Validate society exists
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid society'
      });
    }

    // Check if admin code is provided and valid
    let targetAdmin = null;
    if (adminCode) {
      targetAdmin = await User.findByAdminCode(adminCode);
      if (!targetAdmin) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid admin code'
        });
      }
    }

    // Create new issue
    const issue = new Issue({
      title,
      description,
      category,
      priority: priority || 'Medium',
      societyId,
      residentInfo,
      location: location || {},
      urgencyLevel: urgencyLevel || 5,
      targetAdminId: targetAdmin ? targetAdmin._id : null,
      adminCode: adminCode ? adminCode.toUpperCase() : null
    });

    await issue.save();

    // Populate society information for response
    await issue.populate('societyId', 'name address');

    res.status(201).json({
      status: 'success',
      data: {
        issue,
        message: 'Issue submitted successfully. You will be contacted once it is reviewed.'
      }
    });
  } catch (error) {
    console.error('Submit issue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Debug endpoint to check database status
exports.getDbStatus = async (req, res) => {
  try {
    const Society = require('../models/Society');
    const User = require('../models/User');
    const Asset = require('../models/Asset');
    
    const societyCount = await Society.countDocuments();
    const userCount = await User.countDocuments();
    const assetCount = await Asset.countDocuments();
    
    res.json({
      status: 'success',
      data: {
        societies: societyCount,
        users: userCount,
        assets: assetCount,
        message: societyCount === 0 ? 'Database appears to be empty - run seeding script' : 'Database has data'
      }
    });
  } catch (error) {
    console.error('DB status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get societies list for dropdown (public endpoint)
exports.getSocietiesForForm = async (req, res) => {
  try {
    console.log('Fetching societies for form...');
    const societies = await Society.find({ isActive: { $ne: false } })
      .select('name address')
      .sort('name');
    
    console.log(`Found ${societies.length} societies:`, societies.map(s => s.name));

    res.json({
      status: 'success',
      data: societies
    });
  } catch (error) {
    console.error('Get societies error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Admin endpoints (authentication required)

// Get all issues with filtering
exports.getAllIssues = async (req, res) => {
  try {
    const { status, society, priority, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter query
    const filter = {};
    if (status) filter.status = status;
    if (society) filter.societyId = society;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortQuery = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get issues with populated references
    const issues = await Issue.find(filter)
      .populate('societyId', 'name address')
      .populate('adminReview.reviewedBy', 'firstName lastName')
      .populate('convertedTask.taskId', 'title status')
      .populate('convertedTask.convertedBy', 'firstName lastName')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
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
    console.error('Get issues error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get single issue by ID
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findById(id)
      .populate('societyId', 'name address contactInfo')
      .populate('adminReview.reviewedBy', 'firstName lastName email')
      .populate('convertedTask.taskId')
      .populate('convertedTask.convertedBy', 'firstName lastName');

    if (!issue) {
      return res.status(404).json({
        status: 'error',
        message: 'Issue not found'
      });
    }

    res.json({
      status: 'success',
      data: issue
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Review an issue (approve/reject)
exports.reviewIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, rejectionReason } = req.body;
    const adminId = req.user.id;

    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be Approved or Rejected'
      });
    }

    // Find the issue
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        status: 'error',
        message: 'Issue not found'
      });
    }

    // Check if already reviewed
    if (['Approved', 'Rejected', 'ConvertedToTask'].includes(issue.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Issue has already been reviewed'
      });
    }

    // Update issue
    issue.status = status;
    issue.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || '',
      rejectionReason: status === 'Rejected' ? rejectionReason : undefined
    };

    await issue.save();

    // Populate for response
    await issue.populate('adminReview.reviewedBy', 'firstName lastName');

    res.json({
      status: 'success',
      data: {
        issue,
        message: `Issue ${status.toLowerCase()} successfully`
      }
    });
  } catch (error) {
    console.error('Review issue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Convert approved issue to task
exports.convertToTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assetId,
      assignedManagerId,
      scheduledDate,
      estimatedDuration,
      taskTitle,
      taskDescription
    } = req.body;
    const adminId = req.user.id;

    // Find the issue
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        status: 'error',
        message: 'Issue not found'
      });
    }

    // Check if issue is approved
    if (issue.status !== 'Approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Only approved issues can be converted to tasks'
      });
    }

    // Validate required fields for task creation
    if (!assetId || !assignedManagerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Asset and assigned manager are required for task creation'
      });
    }

    // Validate asset exists and belongs to the same society
    const asset = await Asset.findById(assetId);
    if (!asset || asset.societyId.toString() !== issue.societyId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid asset for this society'
      });
    }

    // Validate manager exists
    const manager = await User.findById(assignedManagerId);
    if (!manager || manager.role !== 'Manager') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid manager'
      });
    }

    // Create task
    const taskData = {
      title: taskTitle || issue.title,
      description: taskDescription || issue.description,
      priority: issue.priority,
      assetId,
      societyId: issue.societyId,
      adminId,
      assignedManagerId,
      scheduledDate: scheduledDate || new Date(),
      estimatedDuration: estimatedDuration || 60,
      issueRef: {
        issueId: issue._id,
        residentInfo: issue.residentInfo
      }
    };

    const task = new Task(taskData);
    await task.save();

    // Update issue status
    issue.status = 'ConvertedToTask';
    issue.convertedTask = {
      taskId: task._id,
      convertedBy: adminId,
      convertedAt: new Date()
    };
    await issue.save();

    // Populate task for response
    await task.populate([
      { path: 'assetId', select: 'name category location' },
      { path: 'societyId', select: 'name' },
      { path: 'assignedManagerId', select: 'firstName lastName email' }
    ]);

    res.json({
      status: 'success',
      data: {
        task,
        issue,
        message: 'Issue converted to task successfully'
      }
    });
  } catch (error) {
    console.error('Convert to task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get issue statistics for dashboard
exports.getIssueStats = async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Issue.aggregate([
      {
        $match: { status: { $in: ['Submitted', 'UnderReview', 'Approved'] } }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent issues (last 7 days)
    const recentIssues = await Issue.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      status: 'success',
      data: {
        statusStats: stats,
        priorityStats,
        categoryStats,
        recentIssues,
        totalIssues: await Issue.countDocuments()
      }
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};