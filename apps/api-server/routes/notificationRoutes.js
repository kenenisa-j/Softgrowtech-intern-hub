// apps/api-server/routes/notificationRoutes.js
// Routes mapping for user notifications.

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect routes
router.use(verifyToken);
router.use(applicationGuard);

// Map notifications actions
router.get('/', notificationController.getNotifications);
router.put('/read', notificationController.markAsRead);

module.exports = router;
