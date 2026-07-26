// apps/api-server/routes/reportRoutes.js
// Routes mapping for PDF report downloads and QR code certificate verification.

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Public Route: Certificate Validation (Accessible by external scanners)
router.get('/verify/:id', reportController.verifyCertificate);

// Protected Routes: Require token validation and active workspace gating
router.get('/attendance/:internId', verifyToken, applicationGuard, reportController.exportAttendanceReport);
router.get('/evaluation/:internId', verifyToken, applicationGuard, reportController.exportEvaluationReport);
router.get('/certificate/:internId', verifyToken, applicationGuard, reportController.exportCertificate);

module.exports = router;
