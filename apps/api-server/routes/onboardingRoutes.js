const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// --- Public Endpoints (Pattern A & Pattern B registration completion) ---
router.post('/tenants/:tenantSlug/apply', onboardingController.applyPublic);
router.post('/auth/register/invite', onboardingController.registerInvite);

// --- Protected Recruitment / Mentor Endpoints ---
router.post('/mentors/invite-intern', verifyToken, requireRole(['mentor', 'admin']), onboardingController.inviteIntern);
router.patch('/mentors/applications/:userId/status', verifyToken, requireRole(['mentor', 'admin']), onboardingController.evaluateApplication);

// --- Workspace / Tenant Settings Endpoints ---
router.get('/tenant/settings', verifyToken, requireRole(['mentor', 'admin']), onboardingController.getTenantSettings);
router.patch('/tenant/settings', verifyToken, requireRole(['mentor', 'admin']), onboardingController.updateTenantSettings);

module.exports = router;
