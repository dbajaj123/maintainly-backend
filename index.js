const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database configuration
const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const managersRoutes = require('./routes/managers');
const societiesRoutes = require('./routes/societies');
const assetLibraryRoutes = require('./routes/assetLibrary');
const assetsRoutes = require('./routes/assets');
const tasksRoutes = require('./routes/tasks');
const issuesRoutes = require('./routes/issues');
const adminLinksRoutes = require('./routes/adminLinks');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { speedInsightsMiddleware, getPerformanceData, getPerformanceSummary } = require('./middleware/speedInsights');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - allow both local and production frontends
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://maintainly-alpha.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Speed Insights middleware for performance tracking
app.use(speedInsightsMiddleware);

// Database connection cache for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }
  
  try {
    cachedConnection = await database.connect();
    // Try to create default admin if it doesn't exist
    await database.createDefaultAdmin().catch(err => {
      console.log('Default admin creation skipped or already exists:', err.message);
    });
    return cachedConnection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Middleware to ensure database connection before each request (except health)
app.use(async (req, res, next) => {
  // Skip database connection for health check
  if (req.path === '/health') {
    return next();
  }
  
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Property Maintenance Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Performance analytics endpoints (for development and monitoring)
app.get('/analytics/performance', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({
    status: 'success',
    data: getPerformanceData(limit)
  });
});

app.get('/analytics/summary', (req, res) => {
  res.json({
    status: 'success',
    data: getPerformanceSummary()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/managers', managersRoutes);
app.use('/api/societies', societiesRoutes);
app.use('/api/asset-library', assetLibraryRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/admin-links', adminLinksRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server (for local development)
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    
    // Create default admin if none exists
    await database.createDefaultAdmin();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Property Maintenance Platform API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      
      // Validate required environment variables
      const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
      const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missing.length > 0) {
        console.warn(`⚠️  Warning: Missing required environment variables: ${missing.join(', ')}`);
        console.warn('   Please check your .env file');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  startServer();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

module.exports = app;