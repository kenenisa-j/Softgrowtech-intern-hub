const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

const getAllTenants = async (req, res, next) => {
  try {
    const tenants = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        plan: true,
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
      plan: t.plan,
      createdAt: t.createdAt,
      userCount: t._count.users
    }));

    return res.json({ tenants: formattedTenants });
  } catch (error) {
    logger.error('Failed to get all tenants', { error: error.message, stack: error.stack });
    next(error);
  }
};

const approveTenant = async (req, res, next) => {
  const { id } = req.params;

  try {
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // Mock welcome email / notification
    logger.info({ msg: `Mock notification: Welcoming approved organization ${updated.name}`, tenantId: id });

    return res.json({
      message: 'Tenant approved and activated successfully.',
      tenant: updated
    });
  } catch (error) {
    logger.error('Failed to approve tenant', { error: error.message, stack: error.stack, tenantId: id });
    next(error);
  }
};

const suspendTenant = async (req, res, next) => {
  const { id } = req.params;

  try {
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { status: 'SUSPENDED' }
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

module.exports = {
  getAllTenants,
  approveTenant,
  suspendTenant
};
