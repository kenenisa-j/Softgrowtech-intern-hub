const express = require('express');
const router = express.Router();

const jwtAuth = require('../middlewares/jwtAuth');
const { exportCohortReport } = require('../controllers/exportController');

// Secure GET /cohort endpoint
router.get('/cohort', jwtAuth, exportCohortReport);

module.exports = router;
