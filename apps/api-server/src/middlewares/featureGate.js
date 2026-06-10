// apps/api-server/src/middlewares/featureGate.js
// Express middleware function to gate endpoints by administrative tenant feature flags.

const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

/**
 * Express middleware to restrict access based on tenant feature flags.
 * 
 * @param {string} featureKey - The feature flag key identifier to query (e.g. 'premium_exports')
 * @returns {import('express').RequestHandler} Express middleware function
 */
function requireFeatureFlag(featureKey) {
  return async (req, res, next) => {
    try {
      // 1. Extract the active tenantId from the request context or fallback to 'x-tenant-id' header
      const tenantId = req.tenantId || req.headers['x-tenant-id'];

      if (!tenantId) {
        logger.warn('Access denied: Tenant context is missing from request during feature flag check', { featureKey });
        return res.status(400).json({
          error: 'Tenant context is missing from the request context.'
        });
      }

      // 2. Query the unique compound index mapping of our MySQL 'TenantFeature' table via Prisma
      const tenantFeature = await prisma.tenantFeature.findUnique({
        where: {
          tenant_id_feature_key: {
            tenant_id: tenantId,
            feature_key: featureKey,
          },
        },
      });

      // 3. If missing or disabled, block the request with a '403 Forbidden' response
      if (!tenantFeature || !tenantFeature.is_enabled) {
        logger.info(`Access denied: Feature flag '${featureKey}' is disabled or missing for tenant`, {
          tenantId,
          featureKey,
        });
        return res.status(403).json({
          error: `The premium module '${featureKey}' is locked under your active subscription tier.`,
          featureKey,
          is_enabled: false
        });
      }

      // 4. If active, invoke next() to pass execution down the routing line
      next();
    } catch (error) {
      logger.error('Error in requireFeatureFlag middleware execution', {
        featureKey,
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        error: 'Internal server error while resolving tenant feature permissions.'
      });
    }
  };
}

module.exports = { requireFeatureFlag };
