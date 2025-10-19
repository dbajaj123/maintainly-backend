const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
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
  assignedManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'PendingVerification', 'Completed', 'RequiresAttention'],
    default: 'Pending'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: 15,
    default: 60
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  verificationPhotoUrl: {
    type: String,
    trim: true
  },
  verificationNotes: {
    type: String,
    trim: true
  },
  completionNotes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Reference to original issue if task was created from resident issue
  issueRef: {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue'
    },
    residentInfo: {
      name: String,
      phone: String,
      email: String,
      flatNumber: String
    }
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ adminId: 1 });
taskSchema.index({ assignedManagerId: 1 });
taskSchema.index({ societyId: 1 });
taskSchema.index({ assetId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ scheduledDate: 1 });
taskSchema.index({ priority: 1, status: 1 });

// Virtual for task duration in minutes
taskSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  return null;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Completed') return false;
  return new Date() > this.scheduledDate;
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update actual times based on status
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'InProgress' && !this.actualStartTime) {
      this.actualStartTime = new Date();
    }
    if (this.status === 'PendingVerification' && !this.actualEndTime) {
      this.actualEndTime = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);