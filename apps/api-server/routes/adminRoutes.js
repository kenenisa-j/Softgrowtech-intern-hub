const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/users/provision', verifyToken, requireRole(['ORG_ADMIN']), adminController.provisionUser);
router.get('/users', verifyToken, requireRole(['ORG_ADMIN']), adminController.getTenantUsers);

module.exports = router;
