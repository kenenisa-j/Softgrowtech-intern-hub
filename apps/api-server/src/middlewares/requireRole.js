const logger = require('../utils/logger');

/**
 * Reusable role guard middleware.
 * Assumes req.user is populated by jwtAuth middleware.
 * 
 * @param {string[]} allowedRoles - List of roles allowed to access the route (e.g. ['SUPERADMIN', 'ORG_ADMIN'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User session not found.' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      logger.warn(`Access forbidden for role: ${userRole}. Required roles: [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ message: 'Forbidden. You do not have permission to access this resource.' });
    }

    next();
  };
};

module.exports = requireRole;
