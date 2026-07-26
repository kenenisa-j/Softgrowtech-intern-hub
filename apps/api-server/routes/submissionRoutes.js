const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect all routes with auth middleware
router.use(verifyToken);
router.use(applicationGuard);

// Map routes
router.post('/', requireRole(['INTERN']), submissionController.submitTask);
router.get('/', submissionController.getSubmissions);
router.put('/grade/:id', requireRole(['MENTOR', 'ORG_ADMIN', 'ADMIN']), submissionController.gradeSubmission);

module.exports = router;
