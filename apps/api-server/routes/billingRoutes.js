// Billing routes stub — payment/billing is disabled. All plans are free and unlimited.
const express = require('express');
const router = express.Router();

// Stub endpoint — always returns success for backward compatibility
router.post('/initialize', (req, res) => {
  return res.status(200).json({
    message: 'All plans are free and unlimited. No payment required.',
    checkoutUrl: null,
    isPaymentActive: true,
    isBillingActive: true,
    pendingApproval: false
  });
});

// Stub webhook — not used but kept to avoid 404 errors on old references
router.post('/webhook', (req, res) => {
  return res.status(200).json({ message: 'Webhook acknowledged.', processed: true });
});

module.exports = router;
