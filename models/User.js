const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager'],
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'Manager';
    }
  },
  // Unique admin code for generating custom issue submission links
  adminCode: {
    type: String,
    unique: true,
    sparse: true, // Only apply unique constraint to non-null values
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        // Only validate if this is an Admin and adminCode is provided
        if (this.role === 'Admin' && v) {
          return /^[A-Z0-9]{6,12}$/.test(v);
        }
        return true;
      },
      message: 'Admin code must be 6-12 characters long and contain only uppercase letters and numbers'
    }
  },
  // Admin-specific settings
  adminSettings: {
    organizationName: {
      type: String,
      trim: true
    },
    customBranding: {
      logoUrl: String,
      primaryColor: String,
      companyName: String
    },
    issueFormSettings: {
      customFields: [{
        name: String,
        type: {
          type: String,
          enum: ['text', 'number', 'select', 'textarea', 'checkbox']
        },
        required: Boolean,
        options: [String] // For select fields
      }],
      welcomeMessage: String,
      thankYouMessage: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ adminId: 1, role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to generate unique admin code
userSchema.statics.generateAdminCode = async function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    exists = await this.findOne({ adminCode: code });
  }
  
  return code;
};

// Static method to find admin by code
userSchema.statics.findByAdminCode = function(code) {
  return this.findOne({ adminCode: code.toUpperCase(), role: 'Admin', isActive: true });
};

// Pre-save middleware to generate admin code for new admin users
userSchema.pre('save', async function(next) {
  if (this.role === 'Admin' && !this.adminCode && this.isNew) {
    try {
      this.adminCode = await this.constructor.generateAdminCode();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);