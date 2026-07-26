// apps/api-server/src/middlewares/featureGate.js
// Feature gates are DISABLED — all features are free and available to all tenants.

/**
 * Pass-through middleware. Feature flags are not enforced — everything is unlocked.
 * @param {string} featureKey - Unused (kept for API compatibility)
 */
function requireFeatureFlag(featureKey) {
  return async (req, res, next) => {
    // All features are enabled for all tenants — no gating enforced.
    next();
  };
}

module.exports = { requireFeatureFlag };
