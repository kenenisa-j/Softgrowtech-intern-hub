// src/middlewares/subscriptionGate.js
// Middleware to enforce subscription plan resource limits

const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

// Hard‑coded limits matrix (could be moved to config/db later)
const PLAN_LIMITS = {
  Starter: { interns: 50, tracks: 5, tasks: 20 },
  Pro: { interns: 500, tracks: 20, tasks: 100 },
  Enterprise: { interns: Infinity, tracks: Infinity, tasks: Infinity },
};

/**
 * Returns a middleware that checks the requested resource against the tenant's plan.
 * @param {string} resourceType - One of 'interns', 'tracks', or 'tasks'
 */
function checkSubscriptionLimits(resourceType) {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        logger.warn('Tenant ID missing in request for subscription check');
        return res.status(400).json({ error: 'Tenant context missing' });
      }

      // Resolve current plan – fallback to Starter if not set
      const organization = await prisma.organization.findUnique({
        where: { id: tenantId },
        select: { plan: true },
      });
      const plan = organization?.plan || 'Starter';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['Starter'];
      const maxAllowed = limits[resourceType];

      if (maxAllowed === undefined) {
        logger.error('Invalid resource type passed to subscriptionGate', { resourceType });
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Count existing resources for this tenant
      let count = 0;
      switch (resourceType) {
        case 'interns':
          count = await prisma.user.count({ where: { tenant_id: tenantId } });
          break;
        case 'tracks':
          // Assuming a Track model exists (placeholder for real implementation)
          if (prisma.track) {
            count = await prisma.track.count({ where: { tenant_id: tenantId } });
          }
          break;
        case 'tasks':
          // Assuming a Task model exists (placeholder for real implementation)
          if (prisma.task) {
            count = await prisma.task.count({ where: { tenant_id: tenantId } });
          }
          break;
        default:
          count = 0;
      }

      if (count >= maxAllowed) {
        logger.info('Subscription limit reached', { tenantId, plan, resourceType, count, maxAllowed });
        return res.status(403).json({
          error: `Your ${plan} plan allows a maximum of ${maxAllowed} ${resourceType}. Please upgrade your subscription.`,
        });
      }

      next();
    } catch (err) {
      logger.error('Error in subscriptionGate middleware', { error: err.message, stack: err.stack });
      res.status(500).json({ error: 'Internal server error while checking subscription limits' });
    }
  };
}

module.exports = { checkSubscriptionLimits };
