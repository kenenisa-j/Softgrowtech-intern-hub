// apps/api-server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/mentors', requireRole(['ORG_ADMIN', 'ADMIN']), adminController.getTenantMentors);
router.get('/interns', requireRole(['ORG_ADMIN', 'ADMIN']), adminController.getTenantInterns);
router.post('/provision-intern', requireRole(['ORG_ADMIN', 'ADMIN']), adminController.provisionIntern);
router.post('/provision-mentor', requireRole(['ORG_ADMIN', 'ADMIN']), adminController.provisionUser);

module.exports = router;
