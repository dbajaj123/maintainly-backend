const { validationResult } = require('express-validator');
const Society = require('../models/Society');

// Helper function to get admin ID based on user role
const getAdminId = (user) => {
  if (user.role === 'Admin') {
    return user.id;
  } else if (user.role === 'Manager' && user.adminId) {
    return user.adminId;
  }
  return null;
};

/**
 * @desc    Get all societies for the current admin
 * @route   GET /api/societies
 * @access  Private (Admin)
 */
const getSocieties = async (req, res, next) => {
  try {
    const adminId = getAdminId(req.user);
    const societies = await Society.find({
      adminId: adminId,
      isActive: true
    }).sort({ name: 1 });

    res.json({
      status: 'success',
      data: {
        societies,
        count: societies.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get society by ID
 * @route   GET /api/societies/:id
 * @access  Private (Admin)
 */
const getSocietyById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const society = await Society.findOne({
      _id: req.params.id,
      adminId: req.resourceAdminId,
      isActive: true
    });

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        society
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new society
 * @route   POST /api/societies
 * @access  Private (Admin)
 */
const createSociety = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const societyData = {
      ...req.body,
      adminId: req.user.id
    };

    const society = new Society(societyData);
    await society.save();

    res.status(201).json({
      status: 'success',
      message: 'Society created successfully',
      data: {
        society
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update society
 * @route   PUT /api/societies/:id
 * @access  Private (Admin)
 */
const updateSociety = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Remove fields that shouldn't be updated
    const { adminId, ...updateData } = req.body;

    const society = await Society.findOneAndUpdate(
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
    );

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Society updated successfully',
      data: {
        society
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete society (soft delete)
 * @route   DELETE /api/societies/:id
 * @access  Private (Admin)
 */
const deleteSociety = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const society = await Society.findOneAndUpdate(
      {
        _id: req.params.id,
        adminId: req.resourceAdminId,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!society) {
      return res.status(404).json({
        status: 'error',
        message: 'Society not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Society deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSocieties,
  getSocietyById,
  createSociety,
  updateSociety,
  deleteSociety
};