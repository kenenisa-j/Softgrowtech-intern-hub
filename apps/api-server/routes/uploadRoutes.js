// apps/api-server/routes/uploadRoutes.js
// Routes mapping for file uploads.

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect routes
router.use(verifyToken);
router.use(applicationGuard);

// Map upload action
router.post('/', uploadController.uploadFile);

module.exports = router;
