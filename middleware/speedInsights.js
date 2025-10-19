// For Node.js backend, we'll use a simpler approach
// The @vercel/speed-insights package is primarily for frontend
// For backend, we'll implement custom performance tracking

let isVercelEnvironment = process.env.VERCEL === '1';
let performanceData = [];

/**
 * Middleware to track API performance with custom metrics
 * This middleware captures timing data for API endpoints
 */
function speedInsightsMiddleware(req, res, next) {
  // Skip tracking for health checks and static files
  if (req.path === '/health' || req.path.startsWith('/static')) {
    return next();
  }

  const startTime = Date.now();
  const originalEnd = res.end;

  // Override res.end to capture timing
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Track the API call performance
    try {
      const performanceMetric = {
        name: `API: ${req.method} ${req.route?.path || req.path}`,
        value: duration,
        unit: 'millisecond',
        tags: {
          method: req.method,
          status: res.statusCode,
          route: req.route?.path || req.path,
          endpoint: req.originalUrl,
          timestamp: new Date().toISOString()
        }
      };

      // Store performance data
      performanceData.push(performanceMetric);
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${performanceMetric.name}: ${duration}ms [${res.statusCode}]`);
      }
      
      // Keep only last 1000 entries to prevent memory issues
      if (performanceData.length > 1000) {
        performanceData = performanceData.slice(-500);
      }
      
    } catch (error) {
      console.warn('Performance tracking error:', error.message);
    }

    // Call the original end method
    originalEnd.apply(this, args);
  };

  next();
}

/**
 * Function to manually track custom events
 * @param {string} name - Event name
 * @param {number} value - Performance value
 * @param {string} unit - Unit of measurement
 * @param {object} tags - Additional tags
 */
function trackEvent(name, value, unit = 'millisecond', tags = {}) {
  try {
    const event = {
      name,
      value,
      unit,
      tags: {
        ...tags,
        timestamp: new Date().toISOString()
      }
    };
    
    performanceData.push(event);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${value} ${unit}`, tags);
    }
    
    // Keep memory usage in check
    if (performanceData.length > 1000) {
      performanceData = performanceData.slice(-500);
    }
    
  } catch (error) {
    console.warn('Custom event tracking error:', error.message);
  }
}

/**
 * Track database operation performance
 * @param {string} operation - Database operation name
 * @param {function} asyncOperation - Async function to track
 * @param {object} tags - Additional tags
 */
async function trackDatabaseOperation(operation, asyncOperation, tags = {}) {
  const startTime = Date.now();
  
  try {
    const result = await asyncOperation();
    const duration = Date.now() - startTime;
    
    trackEvent(`DB: ${operation}`, duration, 'millisecond', {
      ...tags,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    trackEvent(`DB: ${operation}`, duration, 'millisecond', {
      ...tags,
      success: false,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Get performance analytics data
 * @param {number} limit - Number of recent entries to return
 * @returns {Array} Performance data
 */
function getPerformanceData(limit = 100) {
  return performanceData.slice(-limit);
}

/**
 * Get performance summary
 * @returns {Object} Performance summary statistics
 */
function getPerformanceSummary() {
  if (performanceData.length === 0) {
    return { message: 'No performance data available' };
  }

  const apiCalls = performanceData.filter(d => d.name.startsWith('API:'));
  const totalCalls = apiCalls.length;
  const avgDuration = apiCalls.reduce((sum, call) => sum + call.value, 0) / totalCalls;
  
  const statusCodes = {};
  const endpoints = {};
  
  apiCalls.forEach(call => {
    const status = call.tags?.status || 'unknown';
    const endpoint = call.tags?.endpoint || 'unknown';
    
    statusCodes[status] = (statusCodes[status] || 0) + 1;
    if (!endpoints[endpoint]) {
      endpoints[endpoint] = { count: 0, totalDuration: 0, avgDuration: 0 };
    }
    endpoints[endpoint].count++;
    endpoints[endpoint].totalDuration += call.value;
    endpoints[endpoint].avgDuration = endpoints[endpoint].totalDuration / endpoints[endpoint].count;
  });

  return {
    totalApiCalls: totalCalls,
    averageDuration: Math.round(avgDuration * 100) / 100,
    statusCodes,
    topEndpoints: Object.entries(endpoints)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({
        endpoint,
        calls: stats.count,
        avgDuration: Math.round(stats.avgDuration * 100) / 100
      }))
  };
}

module.exports = {
  speedInsightsMiddleware,
  trackEvent,
  trackDatabaseOperation,
  getPerformanceData,
  getPerformanceSummary
};