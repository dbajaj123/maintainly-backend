const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    }
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  contactInfo: {
    primaryContact: {
      name: String,
      phone: String,
      email: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      email: String
    }
  },
  totalUnits: {
    type: Number,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
societySchema.index({ adminId: 1 });
societySchema.index({ name: 1, adminId: 1 });

// Virtual for full address
societySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Ensure virtual fields are serialized
societySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Society', societySchema);