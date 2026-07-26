const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Pattern A: Public application board (unauthenticated)
const applyPublic = async (req, res, next) => {
  const { tenantSlug } = req.params;
  const { name, email, password, domain } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // Find organization by subdomain / slug
    const org = await prisma.tenant.findUnique({
      where: { subdomain: tenantSlug.toLowerCase() }
    });

    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    // Verify onboarding mode
    if (org.onboardingMode === 'PRIVATE') {
      return res.status(403).json({ message: 'This organization does not accept public applications.' });
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenant_id: org.id }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Application or account already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with PENDING status
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: 'INTERN',
        domain: domain || 'Full-Stack',
        status: 'PENDING',
        tenant_id: org.id
      }
    });

    logger.info({ msg: 'Public intern application created', userId: createdUser.id, tenantId: org.id });

    return res.status(201).json({
      message: 'Application submitted successfully and is pending review.',
      userId: createdUser.id,
      status: 'PENDING'
    });
  } catch (error) {
    logger.error('Failed to submit public application', { error: error.message, tenantSlug });
    next(error);
  }
};

// Pattern B: Mentor generates secure invitation (protected for mentors/admins)
const inviteIntern = async (req, res, next) => {
  const { email } = req.body;
  const tenantId = req.tenantId;

  if (!email) {
    return res.status(400).json({ message: 'Email is required for invitation.' });
  }

  try {
    // Check if a role named 'intern' exists under the tenant, if not create it
    let role = await prisma.role.findFirst({
      where: { tenant_id: tenantId, name: 'intern' }
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          tenant_id: tenantId,
          name: 'intern'
        }
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await prisma.invitation.create({
      data: {
        tenant_id: tenantId,
        email,
        role_id: role.id,
        token,
        expires_at: expiresAt
      }
    });

    logger.info({ msg: 'Intern invitation generated', email, token, tenantId });

    return res.status(201).json({
      message: 'Invitation generated successfully.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expires_at
      }
    });
  } catch (error) {
    logger.error('Failed to generate intern invitation', { error: error.message, tenantId });
    next(error);
  }
};

// Pattern B: Accept invite and register (unauthenticated)
const registerInvite = async (req, res, next) => {
  const { token, name, password, domain } = req.body;

  if (!token || !name || !password) {
    return res.status(400).json({ message: 'Token, name, and password are required.' });
  }

  try {
    // Find invitation
    const invitation = await prisma.invitation.findFirst({
      where: { token, is_accepted: false }
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or pre-used invitation token.' });
    }

    if (new Date() > invitation.expires_at) {
      return res.status(410).json({ message: 'Invitation has expired.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create pre-approved user (status = ACCEPTED)
    const user = await prisma.user.create({
      data: {
        name,
        email: invitation.email,
        password_hash: passwordHash,
        role: 'INTERN',
        domain: domain || 'Full-Stack',
        status: 'ACCEPTED',
        tenant_id: invitation.tenant_id
      }
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { is_accepted: true }
    });

    logger.info({ msg: 'Onboarded intern via invite link', userId: user.id, tenantId: invitation.tenant_id });

    return res.status(201).json({
      message: 'Account registered successfully and pre-approved.',
      userId: user.id,
      status: 'ACCEPTED'
    });
  } catch (error) {
    logger.error('Failed to register via invitation', { error: error.message });
    next(error);
  }
};

// Recruitment Decision Controller (protected for mentors/admins)
const evaluateApplication = async (req, res, next) => {
  const { userId } = req.params;
  const { status } = req.body; // ACCEPTED or REJECTED
  const tenantId = req.tenantId;

  if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be ACCEPTED or REJECTED.' });
  }

  try {
    // Find user to verify tenant scope
    const user = await prisma.user.findFirst({
      where: { id: userId, tenant_id: tenantId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Applicant not found under this tenant.' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    logger.info({ msg: `Applicant status evaluated: ${status}`, userId, tenantId });

    return res.json({
      message: `Applicant status successfully set to ${status}.`,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        status: updated.status
      }
    });
  } catch (error) {
    logger.error('Failed to evaluate application status', { error: error.message, userId, tenantId });
    next(error);
  }
};

// Get tenant onboarding settings (protected)
const getTenantSettings = async (req, res, next) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }
  try {
    const org = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }
    return res.json({
      onboardingMode: org.onboardingMode,
      status: org.status,
      name: org.name,
      subdomain: org.subdomain
    });
  } catch (error) {
    logger.error('Failed to get tenant settings', { error: error.message, tenantId });
    next(error);
  }
};

// Update tenant onboarding settings (protected, admin/mentor only)
const updateTenantSettings = async (req, res, next) => {
  const tenantId = req.tenantId;
  const { onboardingMode } = req.body;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }

  if (!onboardingMode || !['PUBLIC', 'PRIVATE'].includes(onboardingMode)) {
    return res.status(400).json({ message: 'Invalid onboardingMode. Must be PUBLIC or PRIVATE.' });
  }

  try {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingMode }
    });

    logger.info({ msg: 'Tenant settings updated', tenantId, onboardingMode });

    return res.json({
      message: 'Workspace settings updated successfully.',
      onboardingMode: updated.onboardingMode
    });
  } catch (error) {
    logger.error('Failed to update tenant settings', { error: error.message, tenantId });
    next(error);
  }
};

module.exports = {
  applyPublic,
  inviteIntern,
  registerInvite,
  evaluateApplication,
  getTenantSettings,
  updateTenantSettings
};

