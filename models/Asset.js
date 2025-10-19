const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  assetLibraryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssetLibraryItem',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    building: String,
    floor: String,
    room: String,
    description: String
  },
  serialNumber: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  installationDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service'],
    default: 'Good'
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
assetSchema.index({ adminId: 1 });
assetSchema.index({ societyId: 1 });
assetSchema.index({ assetLibraryItemId: 1 });
assetSchema.index({ nextMaintenanceDate: 1 });

// Virtual for full location
assetSchema.virtual('fullLocation').get(function() {
  const loc = this.location;
  const parts = [loc.building, loc.floor, loc.room].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : loc.description || 'Location not specified';
});

// Ensure virtual fields are serialized
assetSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Asset', assetSchema);