const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// Checkout webhook updates are unauthenticated
router.post('/webhook', billingController.processWebhook);

module.exports = router;
