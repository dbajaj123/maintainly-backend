const mongoose = require('mongoose');

const assetLibraryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electrical',
      'Plumbing',
      'HVAC',
      'Security',
      'Landscaping',
      'Structural',
      'Cleaning',
      'Fire Safety',
      'Elevator',
      'Generator',
      'Water System',
      'Waste Management',
      'Other'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maintenanceFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'],
    default: 'Monthly'
  },
  estimatedCost: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  safetyRequirements: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
assetLibraryItemSchema.index({ adminId: 1 });
assetLibraryItemSchema.index({ category: 1, adminId: 1 });
assetLibraryItemSchema.index({ name: 1, adminId: 1 });

module.exports = mongoose.model('AssetLibraryItem', assetLibraryItemSchema);