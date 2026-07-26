// apps/api-server/routes/inviteRoutes.js
const express = require('express')
const router = express.Router()
const { generateInvite, verifyInviteToken, acceptInvite } = require('../controllers/inviteController')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

// Public
router.get('/verify/:token', verifyInviteToken)
router.post('/accept', acceptInvite)

// Protected
router.post('/generate', verifyToken, requireRole(['ORG_ADMIN', 'ADMIN']), generateInvite)

module.exports = router
