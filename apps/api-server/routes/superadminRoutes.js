const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Protect all routes under this namespace with JWT check & Superadmin role verification
router.use(verifyToken);
router.use(requireRole(['superadmin']));

// Superadmin Tenant Control Channels
router.get('/tenants', superadminController.getAllTenants);
router.post('/tenants/:id/approve', superadminController.approveTenant);
router.post('/tenants/:id/suspend', superadminController.suspendTenant);

module.exports = router;
