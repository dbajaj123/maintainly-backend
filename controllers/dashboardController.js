const Society = require('../models/Society');
const Task = require('../models/Task');
const Asset = require('../models/Asset');
const Issue = require('../models/Issue');

/**
 * @desc    Get dashboard overview data
 * @route   GET /api/dashboard
 * @access  Private (Admin/Manager)
 */
const getDashboard = async (req, res, next) => {
  try {
    // Build filters based on user role
    let filter = {};
    
    if (req.user.role === 'Admin') {
      // Admins see only their own data
      filter = { adminId: req.user.id };
    } else if (req.user.role === 'Manager') {
      // Managers see data from their admin only
      filter = { adminId: req.user.adminId };
    }

    // Get basic counts
    const [societiesCount, tasksCount, assetsCount, issuesCount] = await Promise.all([
      Society.countDocuments({ ...filter, isActive: true }),
      Task.countDocuments({ ...filter, isActive: true }),
      Asset.countDocuments({ ...filter, isActive: true }),
      Issue.countDocuments(req.user.role === 'Admin' ? { targetAdminId: req.user.id } : {})
    ]);

    // Get tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get assets by category
    const assetsByCategory = await Asset.aggregate([
      { $match: { ...filter, isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get issues by status
    const issueFilter = req.user.role === 'Admin' ? { targetAdminId: req.user.id } : {};
    const issuesByStatus = await Issue.aggregate([
      { $match: issueFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get pending issues count
    const pendingIssuesCount = await Issue.countDocuments({ 
      ...issueFilter,
      status: { $in: ['Submitted', 'UnderReview'] } 
    });

    // Get recent tasks
    const recentTasks = await Task.find({ ...filter, isActive: true })
      .populate('societyId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description status societyId createdAt');

    // Count completed tasks
    const completedTasksCount = await Task.countDocuments({ 
      ...filter, 
      isActive: true,
      status: 'Completed' 
    });

    // Format data for charts
    const taskStatusData = tasksByStatus.map(item => ({
      label: item._id?.charAt(0).toUpperCase() + item._id?.slice(1).replace('_', ' ') || 'Unknown',
      value: item.count
    }));

    const assetCategoryData = assetsByCategory.map(item => ({
      label: item._id?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other',
      value: item.count
    }));

    const issueStatusData = issuesByStatus.map(item => ({
      label: item._id?.replace(/([A-Z])/g, ' $1').trim() || 'Unknown',
      value: item.count
    }));

    // Format recent tasks
    const formattedRecentTasks = recentTasks.map(task => ({
      id: task._id,
      title: task.title,
      society: task.societyId?.name || 'Unknown Society',
      status: task.status?.charAt(0).toUpperCase() + task.status?.slice(1).replace('_', ' ') || 'Unknown'
    }));

    const dashboardData = {
      stats: {
        totalSocieties: societiesCount,
        totalTasks: tasksCount,
        completedTasks: completedTasksCount,
        totalAssets: assetsCount,
        totalIssues: issuesCount,
        pendingIssues: pendingIssuesCount
      },
      tasksByStatus: taskStatusData,
      assetsByCategory: assetCategoryData,
      issuesByStatus: issueStatusData,
      recentTasks: formattedRecentTasks
    };

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    next(error);
  }
};

module.exports = {
  getDashboard
};