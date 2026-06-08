const express = require('express');
const router = express.Router();

const jwtAuth = require('../middlewares/jwtAuth');
const { submitAssessmentAttempt } = require('../controllers/assessmentController');

// Secure POST / (or /submit) endpoint
router.post(['/', '/submit'], jwtAuth, submitAssessmentAttempt);

module.exports = router;
