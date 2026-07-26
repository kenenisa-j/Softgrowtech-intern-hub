// apps/api-server/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/public', organizationController.getTopOrganizations);
router.get('/:id/profile', organizationController.getPublicOrgProfile);
router.post('/', organizationController.createOrganization);
router.get('/', organizationController.getAllOrganizations);

// Protected — org admin only
router.get('/my-profile', verifyToken, requireRole(['ORG_ADMIN', 'ADMIN']), organizationController.getOwnOrgProfile);
router.put('/profile', verifyToken, requireRole(['ORG_ADMIN', 'ADMIN']), organizationController.updateOrgProfile);

module.exports = router;
