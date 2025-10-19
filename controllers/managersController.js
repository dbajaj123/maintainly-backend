const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @desc    Get all managers
 * @route   GET /api/managers
 * @access  Private (Admin only)
 */
const getManagers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    // Build query
    let query = { role: 'Manager' };
    
    // Add search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    const managers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        managers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single manager
 * @route   GET /api/managers/:id
 * @access  Private (Admin only)
 */
const getManager = async (req, res, next) => {
  try {
    const manager = await User.findOne({ 
      _id: req.params.id, 
      role: 'Manager' 
    }).select('-password');

    if (!manager) {
      return res.status(404).json({
        status: 'error',
        message: 'Manager not found'
      });
    }

    res.json({
      status: 'success',
      data: { manager }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new manager
 * @route   POST /api/managers
 * @access  Private (Admin only)
 */
const createManager = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create manager
    const manager = new User({
      email,
      password: hashedPassword,
      role: 'Manager',
      firstName,
      lastName,
      phone,
      isActive: true
    });

    await manager.save();

    res.status(201).json({
      status: 'success',
      message: 'Manager created successfully',
      data: {
        manager: {
          id: manager._id,
          email: manager.email,
          role: manager.role,
          firstName: manager.firstName,
          lastName: manager.lastName,
          fullName: manager.fullName,
          phone: manager.phone,
          isActive: manager.isActive,
          createdAt: manager.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update manager
 * @route   PUT /api/managers/:id
 * @access  Private (Admin only)
 */
const updateManager = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, isActive } = req.body;
    
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Manager' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!manager) {
      return res.status(404).json({
        status: 'error',
        message: 'Manager not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Manager updated successfully',
      data: { manager }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete manager (soft delete)
 * @route   DELETE /api/managers/:id
 * @access  Private (Admin only)
 */
const deleteManager = async (req, res, next) => {
  try {
    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Manager' },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!manager) {
      return res.status(404).json({
        status: 'error',
        message: 'Manager not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Manager deleted successfully',
      data: { manager }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset manager password
 * @route   POST /api/managers/:id/reset-password
 * @access  Private (Admin only)
 */
const resetManagerPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Manager' },
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!manager) {
      return res.status(404).json({
        status: 'error',
        message: 'Manager not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Manager password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get manager statistics
 * @route   GET /api/managers/stats
 * @access  Private (Admin only)
 */
const getManagerStats = async (req, res, next) => {
  try {
    const totalManagers = await User.countDocuments({ role: 'Manager' });
    const activeManagers = await User.countDocuments({ role: 'Manager', isActive: true });
    const inactiveManagers = totalManagers - activeManagers;

    // Get managers by creation date (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentManagers = await User.find({
      role: 'Manager',
      createdAt: { $gte: sixMonthsAgo }
    }).select('firstName lastName createdAt').sort({ createdAt: -1 }).limit(5);

    res.json({
      status: 'success',
      data: {
        totalManagers,
        activeManagers,
        inactiveManagers,
        recentManagers
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManagers,
  getManager,
  createManager,
  updateManager,
  deleteManager,
  resetManagerPassword,
  getManagerStats
};