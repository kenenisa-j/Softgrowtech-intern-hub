// src/middlewares/subscriptionGate.js
// Subscription limits are DISABLED — all features are free and unlimited.

/**
 * Returns a pass-through middleware. All resource limits are removed.
 * @param {string} resourceType - Unused (kept for API compatibility)
 */
function checkSubscriptionLimits(resourceType) {
  return async (req, res, next) => {
    // All plans are unlimited — no limits enforced.
    next();
  };
}

module.exports = { checkSubscriptionLimits };
