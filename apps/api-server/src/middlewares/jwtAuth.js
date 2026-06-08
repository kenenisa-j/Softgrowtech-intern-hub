// src/middlewares/jwtAuth.js
// Middleware to verify JWT token and attach the user payload to req.user.

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Expected Authorization header: "Bearer <token>"
 */
function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid Authorization format' });
  }
  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.warn('JWT_SECRET is not set in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const payload = jwt.verify(token, secret);
    req.user = payload; // attach decoded payload
    next();
  } catch (err) {
    logger.error('JWT verification failed', { error: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = jwtAuth;
