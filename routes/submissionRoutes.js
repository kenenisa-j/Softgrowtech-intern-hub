const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Protect all routes with auth middleware
router.use(verifyToken);

// Map routes
router.post('/', requireRole(['intern']), submissionController.submitTask);
router.get('/', submissionController.getSubmissions);
router.put('/grade/:id', requireRole(['mentor', 'admin']), submissionController.gradeSubmission);

module.exports = router;
