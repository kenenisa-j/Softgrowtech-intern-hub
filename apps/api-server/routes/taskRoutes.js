const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect all routes with auth middleware
router.use(verifyToken);
router.use(applicationGuard);

// Map routes
router.post('/', requireRole(['MENTOR', 'ORG_ADMIN', 'ADMIN']), taskController.createTask);
router.get('/', taskController.getAllTasks);
router.put('/:id', requireRole(['MENTOR', 'ORG_ADMIN', 'ADMIN']), taskController.editTask);
router.delete('/:id', requireRole(['MENTOR', 'ORG_ADMIN', 'ADMIN']), taskController.deleteTask);

module.exports = router;
