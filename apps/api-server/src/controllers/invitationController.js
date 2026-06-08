// src/controllers/invitationController.js
// Handles invitation creation and acceptance for tenant onboarding

const crypto = require('crypto');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { emailQueue } = require('../config/redisQueue');

/**
 * Send an invitation email to a prospective user.
 * Expected body: { email: string, roleId: string }
 */
async function sendInvitation(req, res) {
  try {
    const { email, roleId } = req.body;
    const tenantId = req.tenantId;
    const organization = req.organization; // populated by tenantResolver

    if (!email || !roleId) {
      return res.status(400).json({ error: 'email and roleId are required' });
    }

    // Generate a secure random token (256‑bit hex string)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Persist invitation record
    const invitation = await prisma.invitation.create({
      data: {
        tenant_id: tenantId,
        email,
        role_id: roleId,
        token,
        expires_at: expiresAt,
        // created_at will be set by DB default
      },
    });

    // Build onboarding URL
    const subdomain = organization?.subdomain || 'app';
    const inviteUrl = `https://${subdomain}.platform.com/accept-invite?token=${token}`;

    // Enqueue email job
    await emailQueue.add('sendOnboardingInvite', {
      to: email,
      inviteUrl,
      organizationName: organization?.name || 'Your Organization',
    });

    logger.info('Invitation created and email enqueued', { invitationId: invitation.id, email, tenantId });
    return res.status(201).json({ message: 'Invitation sent', invitationId: invitation.id });
  } catch (error) {
    logger.error('Failed to send invitation', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to send invitation' });
  }
}

/**
 * Accept an invitation using a token.
 * Expected query param: token
 * Expected body (for new user): { passwordHash: string }
 */
async function acceptInvitation(req, res) {
  try {
    const { token } = req.query;
    const { passwordHash } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { role: true, organization: true },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.is_accepted) {
      return res.status(410).json({ error: 'Invitation already used' });
    }

    if (new Date() > invitation.expires_at) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    // Create user under the organization
    const newUser = await prisma.user.create({
      data: {
        tenant_id: invitation.tenant_id,
        email: invitation.email,
        password_hash: passwordHash || '', // In a real system you'd hash securely before storing
      },
    });

    // Assign role via UserRole bridge table
    await prisma.userRole.create({
      data: {
        user_id: newUser.id,
        role_id: invitation.role_id,
      },
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { is_accepted: true },
    });

    logger.info('Invitation accepted and user created', { userId: newUser.id, invitationId: invitation.id });
    return res.status(200).json({ message: 'Account created successfully', userId: newUser.id });
  } catch (error) {
    logger.error('Error accepting invitation', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to accept invitation' });
  }
}

module.exports = {
  sendInvitation,
  acceptInvitation,
};
