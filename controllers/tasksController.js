const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Society = require('../models/Society');
const supabaseStorageService = require('../services/supabaseStorageService');

/**
 * @desc    Get tasks (Admins see all their tasks, Managers see their assigned tasks)
 * @route   GET /api/tasks
 * @access  Private (Admin/Manager)
 */
const getTasks = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, priority, societyId, assetId, page = 1, limit = 20 } = req.query;
    
    let filter = {
      isActive: true
    };

    // Filter based on user role
    if (req.user.role === 'Admin') {
      // Admins see tasks where they are the admin
      filter.adminId = req.user.id;
    } else if (req.user.role === 'Manager') {
      // Managers can only see tasks assigned to them
      filter.assignedManagerId = req.user.id;
      // Managers should only see tasks from their admin (if adminId is set)
      if (req.user.adminId) {
        filter.adminId = req.user.adminId;
      }
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (societyId) filter.societyId = societyId;
    if (assetId) filter.assetId = assetId;

    console.log('getTasks filter:', {
      filter,
      userId: req.user.id,
      userRole: req.user.role,
      resourceAdminId: req.resourceAdminId,
      requestedStatus: status
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(filter)
      .populate('assetId', 'name location')
      .populate('societyId', 'name')
      .populate('assignedManagerId', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ scheduledDate: 1, priority: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTasks = await Task.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTasks / parseInt(limit)),
          totalTasks,
          hasNext: skip + tasks.length < totalTasks,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task by ID
 * @route   GET /api/tasks/:id
 * @access  Private (Admin/Manager)
 */
const getTaskById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let filter = {
      _id: req.params.id,
      isActive: true
    };

    // Filter based on user role
    if (req.user.role === 'Admin') {
      // Admins see tasks where they are the admin
      filter.adminId = req.user.id;
    } else if (req.user.role === 'Manager') {
      // Managers can only see tasks assigned to them
      filter.assignedManagerId = req.user.id;
      // Managers should only see tasks from their admin (if adminId is set)
      if (req.user.adminId) {
        filter.adminId = req.user.adminId;
      }
    }

    const task = await Task.findOne(filter)
      .populate('assetId', 'name location serialNumber')
      .populate('societyId', 'name address')
      .populate('assignedManagerId', 'firstName lastName email phone')
      .populate('verifiedBy', 'firstName lastName');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private (Admin)
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { assetId, assignedManagerId } = req.body;

    // Verify that asset belongs to current admin
    const asset = await Asset.findOne({
      _id: assetId,
      adminId: req.user.id,
      isActive: true
    }).populate('societyId');

    if (!asset) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid asset ID or asset not found'
      });
    }

    // Verify that manager belongs to current admin
    const manager = await User.findOne({
      _id: assignedManagerId,
      role: 'Manager',
      adminId: req.user.id,
      isActive: true
    });

    if (!manager) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid manager ID or manager not found'
      });
    }

    const taskData = {
      ...req.body,
      adminId: req.user.id,
      societyId: asset.societyId._id
    };

    const task = new Task(taskData);
    await task.save();

    // Populate the task before returning
    await task.populate([
      { path: 'assetId', select: 'name location' },
      { path: 'societyId', select: 'name' },
      { path: 'assignedManagerId', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task (general edits by Admin)
 * @route   PATCH /api/tasks/:id
 * @access  Private (Admin)
 */
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { assignedManagerId, ...updateData } = req.body;

    // If updating assigned manager, verify they belong to current admin
    if (assignedManagerId) {
      const manager = await User.findOne({
        _id: assignedManagerId,
        role: 'Manager',
        adminId: req.user.id,
        isActive: true
      });

      if (!manager) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid manager ID or manager not found'
        });
      }
      updateData.assignedManagerId = assignedManagerId;
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        adminId: req.resourceAdminId,
        isActive: true
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('assetId', 'name location')
    .populate('societyId', 'name')
    .populate('assignedManagerId', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Task updated successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Admin)
 */
const deleteTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        adminId: req.resourceAdminId,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start working on a task (Manager changes status to InProgress)
 * @route   POST /api/tasks/:id/start
 * @access  Private (Manager - must be assigned to this task)
 */
const startTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let filter = {
      _id: req.params.id,
      isActive: true
    };

    // Both Admin and Manager can start tasks, but Manager must be assigned
    if (req.user.role === 'Manager') {
      filter.assignedManagerId = req.user.id;
      filter.adminId = req.resourceAdminId;
    } else {
      filter.adminId = req.resourceAdminId;
    }

    const task = await Task.findOne(filter);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not assigned to you'
      });
    }

    if (task.status !== 'Pending') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot start task. Current status: ${task.status}`
      });
    }

    task.status = 'InProgress';
    task.actualStartTime = new Date();
    await task.save();

    await task.populate([
      { path: 'assetId', select: 'name location' },
      { path: 'societyId', select: 'name' },
      { path: 'assignedManagerId', select: 'firstName lastName email' }
    ]);

    res.json({
      status: 'success',
      message: 'Task started successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit task for verification with photo
 * @route   POST /api/tasks/:id/submit-for-verification
 * @access  Private (Manager - must be assigned to this task)
 */
const submitForVerification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { photoUrl, completionNotes } = req.body;

    let filter = {
      _id: req.params.id,
      isActive: true
    };

    // Both Admin and Manager can submit for verification, but Manager must be assigned
    if (req.user.role === 'Manager') {
      filter.assignedManagerId = req.user.id;
      // For managers, we only need to check assignment, not adminId since they can only see their assigned tasks
    } else {
      filter.adminId = req.resourceAdminId;
    }

    const task = await Task.findOne(filter);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not assigned to you'
      });
    }

    if (task.status !== 'InProgress') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot submit for verification. Current status: ${task.status}`
      });
    }

    // Validate that the photo URL is from Supabase (basic check)
    if (!photoUrl.includes('supabase.co/storage/v1/object/public/')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid photo URL. Must be a valid Supabase storage URL.'
      });
    }

    task.status = 'PendingVerification';
    task.verificationPhotoUrl = photoUrl;
    task.completionNotes = completionNotes;
    task.actualEndTime = new Date();
    await task.save();

    await task.populate([
      { path: 'assetId', select: 'name location' },
      { path: 'societyId', select: 'name' },
      { path: 'assignedManagerId', select: 'firstName lastName email' }
    ]);

    res.json({
      status: 'success',
      message: 'Task submitted for verification successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify task completion (Admin approves or rejects)
 * @route   POST /api/tasks/:id/verify
 * @access  Private (Admin)
 */
const verifyTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { action, verificationNotes, rejectionReason } = req.body;

    // Build filter for task lookup
    let filter = {
      _id: req.params.id,
      isActive: true
    };

    // For task verification, only admins can verify tasks they own
    if (req.user.role === 'Admin') {
      filter.adminId = req.user.id;
    } else {
      // Non-admins cannot verify tasks
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only admins can verify tasks.'
      });
    }

    console.log('Task verification filter:', {
      filter,
      userId: req.user.id,
      userRole: req.user.role,
      resourceAdminId: req.resourceAdminId
    });

    const task = await Task.findOne(filter);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    if (task.status !== 'PendingVerification') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot verify task. Current status: ${task.status}`
      });
    }

    if (action === 'approve') {
      task.status = 'Completed';
      task.verificationNotes = verificationNotes;
    } else if (action === 'reject') {
      task.status = 'RequiresAttention';
      task.rejectionReason = rejectionReason;
      task.verificationNotes = verificationNotes;
      // Clear the photo URL on rejection (optional - you might want to keep it)
      // task.verificationPhotoUrl = null;
    }

    task.verifiedBy = req.user.id;
    task.verifiedAt = new Date();
    await task.save();

    await task.populate([
      { path: 'assetId', select: 'name location' },
      { path: 'societyId', select: 'name' },
      { path: 'assignedManagerId', select: 'firstName lastName email' },
      { path: 'verifiedBy', select: 'firstName lastName' }
    ]);

    res.json({
      status: 'success',
      message: `Task ${action}d successfully`,
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/tasks/dashboard/stats
 * @access  Private (Admin/Manager)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    let filter = {
      isActive: true
    };

    // Filter based on user role
    if (req.user.role === 'Admin') {
      // Admins see stats for tasks where they are the admin
      filter.adminId = req.user.id;
    } else if (req.user.role === 'Manager') {
      // Managers can only see stats for tasks assigned to them
      filter.assignedManagerId = req.user.id;
      // Managers should only see tasks from their admin (if adminId is set)
      if (req.user.adminId) {
        filter.adminId = req.user.adminId;
      }
    }

    // Get task counts by status
    const taskStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get overdue tasks count
    const overdueFilter = {
      ...filter,
      status: { $nin: ['Completed'] },
      scheduledDate: { $lt: new Date() }
    };
    const overdueCount = await Task.countDocuments(overdueFilter);

    // Get priority distribution
    const priorityStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const statusCounts = {
      Pending: 0,
      InProgress: 0,
      PendingVerification: 0,
      Completed: 0,
      RequiresAttention: 0
    };

    taskStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const priorityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0
    };

    priorityStats.forEach(stat => {
      priorityCounts[stat._id] = stat.count;
    });

    const totalTasks = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    res.json({
      status: 'success',
      data: {
        summary: {
          totalTasks,
          overdueCount,
          completedTasks: statusCounts.Completed,
          pendingTasks: statusCounts.Pending + statusCounts.InProgress,
          awaitingVerification: statusCounts.PendingVerification,
          requiresAttention: statusCounts.RequiresAttention
        },
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate signed URL for photo upload
 * @route   POST /api/tasks/upload-url
 * @access  Private (Manager)
 */
const generateUploadUrl = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fileName, fileType } = req.body;

    // Check if Supabase is configured
    if (!supabaseStorageService.isConfigured()) {
      return res.status(503).json({
        status: 'error',
        message: 'Storage service not configured. Please contact administrator.'
      });
    }

    // Generate unique filename with user and timestamp
    const timestamp = Date.now();
    const userPrefix = `${req.user.role.toLowerCase()}-${req.user.id}`;
    const uniqueFileName = `${userPrefix}-${timestamp}-${fileName}`;

    // Generate signed upload URL
    const uploadData = await supabaseStorageService.generateSignedUploadUrl(
      uniqueFileName,
      3600 // 1 hour expiry
    );

    res.json({
      status: 'success',
      message: 'Upload URL generated successfully',
      data: {
        uploadUrl: uploadData.signedUrl,
        publicUrl: uploadData.publicUrl,
        filePath: uploadData.filePath,
        expiresAt: uploadData.expiresAt,
        instructions: {
          method: 'POST',
          contentType: fileType,
          note: 'Use the uploadUrl to POST the file directly to Supabase. After successful upload, use the publicUrl in the submit-for-verification endpoint.'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload task completion photo
 * @route   POST /api/tasks/:id/upload-photo
 * @access  Private (Manager assigned to task)
 */
const uploadTaskPhoto = async (req, res, next) => {
  try {
    const supabaseStorageService = require('../services/supabaseStorageService');
    
    let filter = {
      _id: req.params.id,
      isActive: true
    };

    // Manager must be assigned to this task
    if (req.user.role === 'Manager') {
      filter.assignedManagerId = req.user.id;
      // Temporarily remove admin filter for managers since adminId might not be set
      // filter.adminId = req.resourceAdminId;
    } else {
      filter.adminId = req.resourceAdminId;
    }

    console.log('Task filter for upload:', {
      filter,
      userId: req.user.id,
      userIdString: req.user.id.toString(),
      userRole: req.user.role,
      resourceAdminId: req.resourceAdminId
    });

    const task = await Task.findOne(filter);

    console.log('Found task:', {
      taskId: task?._id,
      assignedManagerId: task?.assignedManagerId,
      status: task?.status,
      adminId: task?.adminId
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not assigned to you'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No photo file provided'
      });
    }

    console.log('Received file for upload:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname
    });

    // Upload to Supabase
    const uploadResult = await supabaseStorageService.uploadTaskPhoto(
      req.file,
      `${task._id}_${req.user.id}_${Date.now()}`
    );

    res.json({
      status: 'success',
      message: 'Photo uploaded successfully',
      data: {
        photoUrl: uploadResult.publicUrl,
        filePath: uploadResult.filePath
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  submitForVerification,
  verifyTask,
  getDashboardStats,
  generateUploadUrl,
  uploadTaskPhoto
};