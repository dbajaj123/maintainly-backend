const { validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const Society = require('../models/Society');
const AssetLibraryItem = require('../models/AssetLibraryItem');

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
 * @desc    Get all assets for the current admin (optionally filtered by society)
 * @route   GET /api/assets
 * @access  Private (Admin/Manager)
 */
const getAssets = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { societyId, condition, search } = req.query;
    
    let filter = {
      isActive: true
    };

    // Filter based on user role
    if (req.user.role === 'Admin') {
      filter.adminId = req.user.id;
    } else if (req.user.role === 'Manager') {
      // Managers should only see assets from their admin (if adminId is set)
      if (req.user.adminId) {
        filter.adminId = req.user.adminId;
      }
    }

    if (societyId) {
      filter.societyId = societyId;
    }

    if (condition) {
      filter.condition = condition;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(filter)
      .populate('societyId', 'name address')
      .populate('assetLibraryItemId', 'name category')
      .sort({ 'societyId.name': 1, name: 1 });

    res.json({
      status: 'success',
      data: {
        assets,
        count: assets.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get asset by ID
 * @route   GET /api/assets/:id
 * @access  Private (Admin/Manager)
 */
const getAssetById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const adminId = getAdminId(req.user);
    const asset = await Asset.findOne({
      _id: req.params.id,
      adminId: adminId,
      isActive: true
    })
    .populate('societyId', 'name address')
    .populate('assetLibraryItemId', 'name category description maintenanceFrequency');

    if (!asset) {
      return res.status(404).json({
        status: 'error',
        message: 'Asset not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        asset
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new asset
 * @route   POST /api/assets
 * @access  Private (Admin)
 */
const createAsset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { societyId, assetLibraryItemId } = req.body;

    // Debug logging
    console.log('🔍 Creating asset - Debug Info:');
    console.log('   Request societyId:', societyId);
    console.log('   Request assetLibraryItemId:', assetLibraryItemId);
    console.log('   Logged-in admin ID (req.resourceAdminId):', req.resourceAdminId);
    console.log('   Logged-in admin ID (req.user.id):', req.user?.id);

    // Verify that society belongs to current admin
    const society = await Society.findOne({
      _id: societyId,
      adminId: req.resourceAdminId,
      isActive: true
    });

    console.log('   Society found:', society ? `Yes (${society.name})` : 'No');
    if (society) {
      console.log('   Society adminId:', society.adminId);
    }

    if (!society) {
      // Try to find the society without admin filter to see if it exists
      const anySociety = await Society.findOne({ _id: societyId });
      console.log('   Society exists (any admin):', anySociety ? `Yes (adminId: ${anySociety.adminId})` : 'No');
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid society ID or society not found'
      });
    }

    // Verify that asset library item belongs to current admin
    const assetLibraryItem = await AssetLibraryItem.findOne({
      _id: assetLibraryItemId,
      adminId: req.resourceAdminId,
      isActive: true
    });

    if (!assetLibraryItem) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid asset library item ID or item not found'
      });
    }

    const assetData = {
      ...req.body,
      adminId: req.resourceAdminId
    };

    const asset = new Asset(assetData);
    await asset.save();

    // Populate the asset before returning
    await asset.populate([
      { path: 'societyId', select: 'name address' },
      { path: 'assetLibraryItemId', select: 'name category' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Asset created successfully',
      data: {
        asset
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update asset
 * @route   PUT /api/assets/:id
 * @access  Private (Admin)
 */
const updateAsset = async (req, res, next) => {
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
    const { adminId, societyId, assetLibraryItemId, ...updateData } = req.body;

    const asset = await Asset.findOneAndUpdate(
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
    .populate('societyId', 'name address')
    .populate('assetLibraryItemId', 'name category');

    if (!asset) {
      return res.status(404).json({
        status: 'error',
        message: 'Asset not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Asset updated successfully',
      data: {
        asset
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete asset (soft delete)
 * @route   DELETE /api/assets/:id
 * @access  Private (Admin)
 */
const deleteAsset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const asset = await Asset.findOneAndUpdate(
      {
        _id: req.params.id,
        adminId: req.resourceAdminId,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({
        status: 'error',
        message: 'Asset not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
};