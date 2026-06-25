// src/routes/complianceRoutes.js
// Express router for GDPR compliance operations (Data portability and retention)

const express = require('express');
const router = express.Router();
const jwtAuth = require('../middlewares/jwtAuth');
const { softDeleteTenantData, permanentErasure, compileComplianceExport } = require('../services/complianceService');
const logger = require('../utils/logger');

// Secure all compliance endpoints with JWT authentication
router.use(jwtAuth);

/**
 * Access gate verifying user has the administrative role.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    logger.warn('Unauthorized access attempt to compliance endpoint', { userId: req.user?.id, role: req.user?.role });
    return res.status(403).json({ error: 'Access denied. Administrator role required.' });
  }
  next();
}

/**
 * POST /api/v1/compliance/soft-delete
 * Soft deletes tenant user accounts and resets credit usage limits.
 */
router.post('/soft-delete', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is missing from the request.' });
    }

    const result = await softDeleteTenantData(tenantId);
    return res.json(result);
  } catch (error) {
    logger.error('Failed compliance soft-delete transaction', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/compliance/permanent-erase
 * Performs unrecoverable cascading deletion of all tenant data.
 */
router.post('/permanent-erase', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is missing from the request.' });
    }

    const result = await permanentErasure(tenantId);
    return res.json(result);
  } catch (error) {
    logger.error('Failed compliance permanent-erase transaction', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/compliance/export
 * Downloads the full data graph schema of the organization for data portability.
 */
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is missing from the request.' });
    }

    const jsonGraph = await compileComplianceExport(tenantId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tenant-portability-export-${tenantId}.json"`);
    return res.send(jsonGraph);
  } catch (error) {
    logger.error('Failed compliance export compilation', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
