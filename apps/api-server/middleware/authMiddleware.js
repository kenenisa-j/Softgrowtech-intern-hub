const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Expect Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid. Expected "Bearer <token>"' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef');
    req.user = decoded; // contains id, name, role, domain, tenant_id, tenant_name
    if (decoded.tenant_id) {
      req.tenantId = decoded.tenant_id;
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (rolesArray) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }
    
    const userRole = (req.user.role || '').toUpperCase();
    const allowedRoles = rolesArray.map(r => r.toUpperCase());
    
    // Check if the user role matches any allowed role, supporting administrative aliases
    const hasRole = allowedRoles.some(allowedRole => {
      if (allowedRole === 'ADMIN' || allowedRole === 'ORG_ADMIN') {
        return userRole === 'ORG_ADMIN' || userRole === 'ADMIN';
      }
      return userRole === allowedRole;
    });
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden. Access denied for this role.' });
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
