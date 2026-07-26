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
    let tokenTenantId = null;
    let isSuperadmin = false;

    // Read JWT if present in Authorization header to check roles and extract tenant context
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef');
          if (decoded) {
            tokenTenantId = decoded.tenantId || decoded.tenant_id;
            if (decoded.role === 'superadmin' || decoded.role === 'SUPERADMIN') {
              isSuperadmin = true;
            }
          }
        } catch (err) {
          // Token decode errors ignored here; authenticating middleware will handle invalid signatures downstream
        }
      }
    }

    // 1. Try resolving via subdomain
    if (subdomain) {
      organization = await prisma.tenant.findUnique({
        where: { subdomain },
        include: { tenantSettings: true },
      });
    }

    // 2. Try resolving via explicit header
    if (!organization) {
      const tenantIdHeader = req.headers['x-tenant-id'];
      if (tenantIdHeader) {
        organization = await prisma.tenant.findUnique({
          where: { id: tenantIdHeader },
          include: { tenantSettings: true },
        });
      }
    }

    // 3. Try resolving via JWT token tenant context fallback (essential for local API testing without subdomain/custom headers)
    if (!organization && tokenTenantId) {
      organization = await prisma.tenant.findUnique({
        where: { id: tokenTenantId },
        include: { tenantSettings: true },
      });
    }

    // 4. Fallback to first organization in database (or create default)
    if (!organization) {
      organization = await prisma.tenant.findFirst({
        include: { tenantSettings: true },
      });

    if (!organization) {
      organization = await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          subdomain: 'default',
          status: 'ACTIVE',
          tenantSettings: {
            create: {
              brand_color_hex: '#6366F1',
              timezone: 'UTC',
            },
          },
          tenantCredits: {
            create: {
              monthly_credit_limit: 1000.00,
              credits_consumed: 0.00,
            },
          },
        },
        include: { tenantSettings: true },
      });
      logger.info('Created default organization and settings for initial setup.');
    }

    // Bypass list — paths that must never be blocked regardless of tenant status
    const pathLower = (req.path || '').toLowerCase();
    const isBypassedRoute =
      pathLower.endsWith('/auth/register') ||
      pathLower.endsWith('/auth/login') ||
      pathLower.endsWith('/organizations') ||
      pathLower.includes('/reports/verify/') ||
      pathLower.includes('/programs/stats') ||
      pathLower.includes('/programs/categories') ||
      pathLower.includes('/programs/featured') ||
      pathLower.includes('/programs/public') ||
      pathLower.includes('/programs/apply') ||
      pathLower.includes('/students/') ||
      pathLower.includes('/applications') ||
      pathLower.includes('/organizations/public') ||
      (pathLower.includes('/organizations/') && pathLower.includes('/profile')) ||
      pathLower.includes('/invites/verify/') ||
      pathLower.includes('/invites/accept') ||
      pathLower.includes('/verify/');

    // Global Tenant Lock: Block requests if organization is SUSPENDED (unless superadmin or bypassed route)
    if (!isBypassedRoute && !isSuperadmin && organization && organization.status === 'SUSPENDED') {
      logger.warn(`Workspace block: Path ${pathLower} is suspended (Status: ${organization.status})`);
      return res.status(403).json({
        message: `Forbidden. This workspace has been suspended by the administrator.`
      });
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
