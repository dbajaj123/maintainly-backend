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
    // Get basic counts
    const [societiesCount, tasksCount, assetsCount, issuesCount] = await Promise.all([
      Society.countDocuments({ isActive: true }),
      Task.countDocuments(),
      Asset.countDocuments(),
      Issue.countDocuments()
    ]);

    // Get tasks by status
    const tasksByStatus = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get assets by category
    const assetsByCategory = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get issues by status
    const issuesByStatus = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get pending issues count
    const pendingIssuesCount = await Issue.countDocuments({ 
      status: { $in: ['Submitted', 'UnderReview'] } 
    });

    // Get recent tasks
    const recentTasks = await Task.find()
      .populate('societyId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description status societyId createdAt');

    // Count completed tasks
    const completedTasksCount = await Task.countDocuments({ status: 'completed' });

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