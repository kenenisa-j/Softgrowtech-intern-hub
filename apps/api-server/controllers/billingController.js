const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

// Stripe package is required if keys are present
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  logger.warn('Stripe package is not installed. Stripe signature checks will be mocked.');
}

const processWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = null;

  try {
    // 1. Verify Event Signature (or mock it in development if secrets are not defined)
    if (stripe && sig && endpointSecret && req.rawBody) {
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
      } catch (err) {
        logger.error('Stripe webhook signature verification failed', { error: err.message });
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }
    } else {
      // Development Mock Bypass: Extract event directly from body
      logger.warn('⚠️ Webhook Signature Verification Bypassed (Stripe secrets not fully defined). Using mock parser.');
      event = req.body;
    }

    // 2. Validate Event Structure
    if (!event || !event.id || !event.type) {
      return res.status(400).json({ message: 'Invalid webhook event payload structure.' });
    }

    const eventId = event.id;

    // 3. Idempotency Check: Verify if event has already been processed
    const existingEvent = await prisma.processedEvent.findUnique({
      where: { id: eventId }
    });

    if (existingEvent) {
      logger.info({ msg: 'Webhook event already processed. Acknowledging duplicate.', eventId });
      return res.status(200).json({ message: 'Event already processed', processed: false });
    }

    // 4. Process targeted event: checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (!session) {
        return res.status(400).json({ message: 'Session data object missing from event.' });
      }

      // Retrieve metadata populated during checkout session creation
      const { tenantId, chosenTier } = session.metadata || {};

      if (!tenantId) {
        logger.error('Checkout completed webhook failed: tenantId missing from session metadata', { sessionId: session.id });
        return res.status(400).json({ message: 'tenantId missing from session metadata.' });
      }

      const normalizedTier = (chosenTier || 'starter').toLowerCase();
      let creditRefillAmount = 500; // default Starter allocation
      if (normalizedTier === 'enterprise') {
        creditRefillAmount = 5000;
      } else if (normalizedTier === 'pro') {
        creditRefillAmount = 1500;
      }

      logger.info({ msg: 'Provisioning tenant B2B subscription', tenantId, tier: normalizedTier, credits: creditRefillAmount });

      // 5. Execute DB updates atomically in a Prisma Transaction
      await prisma.$transaction(async (tx) => {
        // Enforce idempotency: Create processed event entry first
        await tx.processedEvent.create({
          data: {
            id: eventId,
            processedAt: new Date()
          }
        });

        // Update Organization settings & status
        const updatedOrg = await tx.organization.update({
          where: { id: tenantId },
          data: {
            isBillingActive: true,
            status: 'ACTIVE',
            plan: chosenTier || 'Starter',
            aiCreditsBalance: {
              increment: creditRefillAmount
            }
          }
        });

        logger.info({
          msg: `Refilled tenant credits successfully inside transaction`,
          tenantId,
          orgName: updatedOrg.name,
          newBalance: updatedOrg.aiCreditsBalance
        });
      });
      
      return res.status(200).json({ message: 'Billing provisioning succeeded.', processed: true });
    }

    // Default response for unhandled events
    return res.status(200).json({ message: 'Webhook received but ignored.', processed: false });
  } catch (error) {
    logger.error('Unexpected webhook handler crash', { error: error.message, stack: error.stack });
    next(error);
  }
};

module.exports = {
  processWebhook
};
