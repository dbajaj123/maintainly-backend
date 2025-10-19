const { validationResult } = require('express-validator');
const AssetLibraryItem = require('../models/AssetLibraryItem');

/**
 * @desc    Get all asset library items for the current admin
 * @route   GET /api/asset-library
 * @access  Private (Admin)
 */
const getAssetLibraryItems = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    
    let filter = {
      adminId: req.resourceAdminId,
      isActive: true
    };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const assetLibraryItems = await AssetLibraryItem.find(filter)
      .sort({ category: 1, name: 1 });

    res.json({
      status: 'success',
      data: {
        assetLibraryItems,
        count: assetLibraryItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get asset library item by ID
 * @route   GET /api/asset-library/:id
 * @access  Private (Admin)
 */
const getAssetLibraryItemById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const assetLibraryItem = await AssetLibraryItem.findOne({
      _id: req.params.id,
      adminId: req.resourceAdminId,
      isActive: true
    });

    if (!assetLibraryItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Asset library item not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        assetLibraryItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new asset library item
 * @route   POST /api/asset-library
 * @access  Private (Admin)
 */
const createAssetLibraryItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const assetLibraryItemData = {
      ...req.body,
      adminId: req.user.id
    };

    const assetLibraryItem = new AssetLibraryItem(assetLibraryItemData);
    await assetLibraryItem.save();

    res.status(201).json({
      status: 'success',
      message: 'Asset library item created successfully',
      data: {
        assetLibraryItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update asset library item
 * @route   PUT /api/asset-library/:id
 * @access  Private (Admin)
 */
const updateAssetLibraryItem = async (req, res, next) => {
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

    const assetLibraryItem = await AssetLibraryItem.findOneAndUpdate(
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

    if (!assetLibraryItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Asset library item not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Asset library item updated successfully',
      data: {
        assetLibraryItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete asset library item (soft delete)
 * @route   DELETE /api/asset-library/:id
 * @access  Private (Admin)
 */
const deleteAssetLibraryItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const assetLibraryItem = await AssetLibraryItem.findOneAndUpdate(
      {
        _id: req.params.id,
        adminId: req.resourceAdminId,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!assetLibraryItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Asset library item not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Asset library item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssetLibraryItems,
  getAssetLibraryItemById,
  createAssetLibraryItem,
  updateAssetLibraryItem,
  deleteAssetLibraryItem
};