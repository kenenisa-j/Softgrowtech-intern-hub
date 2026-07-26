const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const { sendEmail } = require('../src/utils/email');

/**
 * Get all tenant workspaces registered on the platform.
 */
const getAllTenants = async (req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        tier: true,
        createdAt: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedTenants = tenants.map(t => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      tier: t.tier,
      createdAt: t.createdAt,
      userCount: t._count.users
    }));

    return res.json({ tenants: formattedTenants });
  } catch (error) {
    logger.error('Failed to get all tenants', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Approve a pending tenant workspace and notify their admin via Resend.
 */
const approveTenant = async (req, res, next) => {
  const { id } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        isBillingActive: true
      }
    });

    // Find organization admin to notify
    const orgAdmin = await prisma.user.findFirst({
      where: {
        tenant_id: id,
        role: 'ORG_ADMIN'
      }
    });

    if (orgAdmin) {
      try {
        await sendEmail({
          to: orgAdmin.email,
          subject: 'Workspace Approved!',
          html: `<p>Dear ${orgAdmin.name},</p><p>Great news! Your workspace <strong>${tenant.name}</strong> (${tenant.subdomain}) has been approved by the platform administrators.</p><p><strong>Workspace Approved! You can now log in.</strong></p><p>Best regards,<br/>The IMS Team</p>`
        });
      } catch (emailError) {
        logger.error('Failed to send workspace approval email', { error: emailError.message, tenantId: id });
      }
    } else {
      logger.warn(`No ORG_ADMIN found for tenant ${id} to send approval email.`);
    }

    logger.info({ msg: `Tenant approved and activated: ${updated.name}`, tenantId: id });

    return res.json({
      message: 'Tenant approved and activated successfully.',
      tenant: updated
    });
  } catch (error) {
    logger.error('Failed to approve tenant', { error: error.message, stack: error.stack, tenantId: id });
    next(error);
  }
};

/**
 * Reject a pending tenant workspace, record a reason, and notify their admin via Resend.
 */
const rejectTenant = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'A rejection reason is required.' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    // Find organization admin to notify
    const orgAdmin = await prisma.user.findFirst({
      where: {
        tenant_id: id,
        role: 'ORG_ADMIN'
      }
    });

    if (orgAdmin) {
      try {
        await sendEmail({
          to: orgAdmin.email,
          subject: 'Application Denied',
          html: `<p>Dear ${orgAdmin.name},</p><p>Thank you for your interest in the Internship Management System. After reviewing your application for the workspace <strong>${tenant.name}</strong> (${tenant.subdomain}), we regret to inform you that it has been denied.</p><p><strong>Application Denied.</strong></p><p><strong>Reason:</strong> ${reason}</p><p>If you believe this was an error, please reach out to support.</p><p>Best regards,<br/>The IMS Team</p>`
        });
      } catch (emailError) {
        logger.error('Failed to send workspace rejection email', { error: emailError.message, tenantId: id });
      }
    } else {
      logger.warn(`No ORG_ADMIN found for tenant ${id} to send rejection email.`);
    }

    logger.info({ msg: `Tenant rejected: ${updated.name}`, tenantId: id, reason });

    return res.json({
      message: 'Tenant registration has been rejected successfully.',
      tenant: updated
    });
  } catch (error) {
    logger.error('Failed to reject tenant', { error: error.message, stack: error.stack, tenantId: id });
    next(error);
  }
};

/**
 * Suspend an active tenant workspace.
 */
const suspendTenant = async (req, res, next) => {
  const { id } = req.params;

  try {
    const org = await prisma.tenant.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        isBillingActive: false
      }
    });

    logger.info({ msg: `Tenant suspended: locked out traffic for ${updated.name}`, tenantId: id });

    return res.json({
      message: 'Tenant has been suspended successfully.',
      tenant: updated
    });
  } catch (error) {
    logger.error('Failed to suspend tenant', { error: error.message, stack: error.stack, tenantId: id });
    next(error);
  }
};

/**
 * Get platform-wide dashboard analytics (Superadmin only)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalCompanies = await prisma.tenant.count();
    const pendingCompanies = await prisma.tenant.count({ where: { status: 'PENDING_APPROVAL' } });
    const approvedCompanies = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const suspendedCompanies = await prisma.tenant.count({ where: { status: 'SUSPENDED' } });

    const totalPrograms = await prisma.internshipProgram.count();
    const totalMentors = await prisma.user.count({ where: { role: 'MENTOR' } });
    const totalInterns = await prisma.user.count({ where: { role: 'INTERN' } });
    const activeInternships = await prisma.user.count({ where: { role: 'INTERN', is_active: true } });
    const completedInternships = await prisma.evaluation.count({ where: { type: 'FINAL' } });

    // (Revenue tracking removed — all plans are free and unlimited)

    // Monthly registrations growth data (last 6 months)
    const now = new Date();
    const registrationsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await prisma.tenant.count({
        where: {
          createdAt: {
            gte: d,
            lt: nextMonth
          }
        }
      });
      registrationsByMonth.push({ month: monthName, registrations: count });
    }

    return res.json({
      stats: {
        totalCompanies,
        pendingCompanies,
        approvedCompanies,
        suspendedCompanies,
        totalPrograms,
        totalMentors,
        totalInterns,
        activeInternships,
        completedInternships,
        registrationsByMonth
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve superadmin stats', { error: error.message });
    next(error);
  }
};

module.exports = {
  getAllTenants,
  approveTenant,
  rejectTenant,
  suspendTenant,
  getDashboardStats
};
