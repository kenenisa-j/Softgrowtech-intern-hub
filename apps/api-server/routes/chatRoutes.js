// apps/api-server/routes/chatRoutes.js
// Routes mapping for the private chat messaging subsystem.

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect all chat routes
router.use(verifyToken);
router.use(applicationGuard);

// Map chat actions
router.get('/history', chatController.getChatHistory);
router.get('/contacts', chatController.getChatContacts);

module.exports = router;
