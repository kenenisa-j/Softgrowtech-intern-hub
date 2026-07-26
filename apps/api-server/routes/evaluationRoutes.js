// apps/api-server/routes/evaluationRoutes.js
// Routes mapping for intern evaluations.

const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Protect all routes
router.use(verifyToken);
router.use(applicationGuard);

// Map routes
router.post('/', requireRole(['MENTOR', 'ORG_ADMIN']), evaluationController.submitEvaluation);
router.get('/', evaluationController.getEvaluations);

module.exports = router;
