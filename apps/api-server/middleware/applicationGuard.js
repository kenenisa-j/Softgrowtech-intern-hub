const logger = require('../src/utils/logger');

/**
 * Defensive gateway middleware that blocks PENDING interns from accessing workspace endpoints.
 */
const applicationGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. User context missing.' });
  }

  // Intercept if the user is an intern but their application is still PENDING
  if (req.user.role === 'intern' && req.user.status === 'PENDING') {
    logger.warn('Quarantined intern blocked by applicationGuard', { userId: req.user.id });
    return res.status(403).json({
      error: 'Access Denied',
      status: 'PENDING_REVIEW',
      message: 'Your registration application is currently pending administrative review.'
    });
  }

  next();
};

module.exports = applicationGuard;
