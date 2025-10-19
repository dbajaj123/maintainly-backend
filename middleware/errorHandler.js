/**
 * Global error handling middleware
 * Catches all errors and returns standardized error responses
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    status: 'error',
    message: 'Internal server error occurred'
  };

  let statusCode = 500;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(e => e.message);
    error.message = 'Validation failed';
    error.details = messages;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    error.message = `${field} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    error.message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    error.message = 'Token expired';
  }

  // Express-validator errors
  if (err.type === 'validation') {
    statusCode = 400;
    error.message = 'Validation failed';
    error.details = err.errors;
  }

  // Custom application errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    error.message = err.message;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    // Only include stack trace in development
    delete error.stack;
    
    // Generic message for 500 errors in production
    if (statusCode === 500) {
      error.message = 'Something went wrong';
    }
  } else {
    // Include stack trace in development
    error.stack = err.stack;
  }

  res.status(statusCode).json(error);
};

module.exports = errorHandler;