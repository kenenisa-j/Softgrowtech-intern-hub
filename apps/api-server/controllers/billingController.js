// billingController.js - Billing/payment features are disabled. All features are free and unlimited.
const logger = require('../src/utils/logger');

const initializeChapaPayment = async (req, res, next) => {
  return res.status(200).json({
    message: 'All plans are free and unlimited. No payment required.',
    checkoutUrl: null,
    isPaymentActive: true,
    isBillingActive: true,
    pendingApproval: false
  });
};

const processWebhook = async (req, res, next) => {
  return res.status(200).json({ message: 'Webhook acknowledged.', processed: true });
};

module.exports = {
  initializeChapaPayment,
  processWebhook
};
