const mongoose = require('mongoose');

/**
 * Database configuration and connection management
 */
class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB database
   */
  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance';
      
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
      };

      this.connection = await mongoose.connect(mongoURI, options);
      
      console.log(`✅ MongoDB connected successfully to: ${this.connection.connection.host}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      
      // Exit process with failure if in production
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('👋 MongoDB connection closed');
        this.connection = null;
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      database: mongoose.connection.name
    };
  }

  /**
   * Create initial admin user if none exists
   */
  async createDefaultAdmin() {
    try {
      const User = require('../models/User');
      const bcrypt = require('bcryptjs');

      // Check if any admin exists
      const adminCount = await User.countDocuments({ role: 'Admin' });
      
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const defaultAdmin = new User({
          email: 'admin@maintainly.com',
          password: hashedPassword,
          role: 'Admin',
          firstName: 'Default',
          lastName: 'Admin',
          phone: '+91-9999999999'
        });

        await defaultAdmin.save();
        console.log('👤 Default admin user created');
        console.log('   Email: admin@maintainly.com');
        console.log('   Password: admin123');
        console.log('   ⚠️  Please change the default password after first login');
      }
    } catch (error) {
      console.error('❌ Error creating default admin:', error.message);
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;