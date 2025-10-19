const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Electrical', 'Plumbing', 'HVAC', 'Security', 'Cleaning', 'Structural', 'Landscaping', 'Other']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'ConvertedToTask'],
    default: 'Submitted'
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  // Resident information (not linked to user account since residents don't have accounts)
  residentInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  // Location where the issue is occurring
  location: {
    building: String,
    floor: String,
    area: String,
    description: String
  },
  // Images uploaded by resident
  images: [{
    url: String,
    filename: String
  }],
  // Target admin for this issue (if submitted via admin-specific link)
  targetAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  // Admin review information
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String
  },
  // Task conversion information
  convertedTask: {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    convertedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    convertedAt: Date
  },
  urgencyLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  }
}, {
  timestamps: true
});

// Index for efficient queries
issueSchema.index({ societyId: 1, status: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ priority: 1, status: 1 });

// Virtual for issue age in days
issueSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
issueSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Issue', issueSchema);