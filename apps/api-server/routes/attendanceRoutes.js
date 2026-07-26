// apps/api-server/routes/attendanceRoutes.js
// Routes mapping for daily check-in/out attendance actions.

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect all routes with auth middleware and workspace block validation
router.use(verifyToken);
router.use(applicationGuard);

// Map attendance actions
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/', attendanceController.getAttendanceLogs);
router.put('/approve/:id', attendanceController.approveAttendance);

module.exports = router;
