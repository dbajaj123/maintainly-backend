/**
 * Role-based authorization middleware
 * Creates middleware functions to check user roles
 */

/**
 * Create authorization middleware for specific roles
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required. Please login first.'
        });
      }

      // Check if user role is allowed
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Authorization error occurred.'
      });
    }
  };
};

/**
 * Check if user is an Admin
 */
const requireAdmin = authorize('Admin');

/**
 * Check if user is a Manager
 */
const requireManager = authorize('Manager');

/**
 * Check if user is either Admin or Manager
 */
const requireAdminOrManager = authorize(['Admin', 'Manager']);

/**
 * Check if user can access resource owned by specific admin
 * For Admins: they can only access their own resources
 * For Managers: they can only access resources from their admin
 */
const requireResourceOwnership = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    // For admins, resourceAdminId should be their own ID
    // For managers, resourceAdminId should be set to their admin's ID
    if (req.user.role === 'Admin') {
      req.resourceAdminId = req.user.id;
    } else if (req.user.role === 'Manager') {
      req.resourceAdminId = req.user.adminId;
    } else {
      req.resourceAdminId = null;
    }
    
    console.log('Resource ownership middleware:', {
      userId: req.user.id,
      userRole: req.user.role,
      userAdminId: req.user.adminId,
      resourceAdminId: req.resourceAdminId
    });
    
    next();
  } catch (error) {
    console.error('Resource ownership middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authorization error occurred.'
    });
  }
};

module.exports = {
  authorize,
  requireAdmin,
  requireManager,
  requireAdminOrManager,
  requireResourceOwnership
};