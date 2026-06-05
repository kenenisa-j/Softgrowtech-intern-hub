const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Protect all routes with auth middleware
router.use(verifyToken);

// Map routes
router.post('/', requireRole(['mentor', 'admin']), taskController.createTask);
router.get('/', taskController.getAllTasks);

module.exports = router;
