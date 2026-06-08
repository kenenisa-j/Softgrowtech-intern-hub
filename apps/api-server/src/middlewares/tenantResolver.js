// src/middlewares/tenantResolver.js
// Express middleware to resolve tenant based on subdomain or X-Tenant-ID header

const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

/**
 * Extract subdomain from a hostname.
 * Example: "acme.platform.com" => "acme"
 * If the hostname does not contain a subdomain (e.g., "platform.com"), returns null.
 */
function getSubdomain(hostname) {
  if (!hostname) return null;
  const parts = hostname.split('.');
  // Assume the base domain is two parts (e.g., platform.com)
  if (parts.length <= 2) return null;
  // Return everything except the last two parts joined by '.' (covers multi‑level subdomains)
  return parts.slice(0, parts.length - 2).join('.');
}

/**
 * Middleware that resolves the tenant (organization) for the incoming request.
 * It populates `req.tenantId` and `req.tenantSettings`.
 *
 * Strategy:
 *   1. Try to get a subdomain from the Host header.
 *   2. If a subdomain exists, look up the Organization by its unique `subdomain` field.
 *   3. If no subdomain or lookup fails, fall back to the `X‑Tenant‑ID` header (useful for API testing).
 *   4. Attach the resolved organization ID and its settings to the request.
 */
async function tenantResolver(req, res, next) {
  try {
    const hostHeader = req.headers.host;
    const subdomain = getSubdomain(hostHeader);
    let organization = null;

    if (subdomain) {
      organization = await prisma.organization.findUnique({
        where: { subdomain },
        include: { tenantSettings: true },
      });
    }

    if (!organization) {
      // Fallback to explicit tenant header – useful for local dev / testing
      const tenantIdHeader = req.headers['x-tenant-id'];
      if (tenantIdHeader) {
        organization = await prisma.organization.findUnique({
          where: { id: tenantIdHeader },
          include: { tenantSettings: true },
        });
      }
    }

    if (!organization) {
      logger.warn('Tenant could not be resolved', { hostHeader, subdomain });
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Attach useful tenant data to the request for downstream handlers
    req.tenantId = organization.id;
    req.tenantSettings = organization.tenantSettings || null;
    req.organization = organization; // optional, can be useful for logging

    next();
  } catch (error) {
    logger.error('Error in tenantResolver middleware', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error while resolving tenant' });
  }
}

module.exports = tenantResolver;
