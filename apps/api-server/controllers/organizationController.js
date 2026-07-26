const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

const createOrganization = async (req, res) => {
  const { name, subdomain } = req.body;
  if (!name || !subdomain) {
    return res.status(400).json({ message: 'Name and subdomain are required.' });
  }

  const normalizedSubdomain = subdomain.trim().toLowerCase();

  try {
    const existingOrg = await prisma.tenant.findUnique({
      where: { subdomain: normalizedSubdomain }
    });
    if (existingOrg) {
      return res.status(400).json({ message: 'Subdomain is already taken.' });
    }

    const org = await prisma.tenant.create({
      data: {
        name: name.trim(),
        subdomain: normalizedSubdomain,
        status: 'PENDING_APPROVAL',
        tenantCredits: {
          create: {
            monthly_credit_limit: 1000.00,
            credits_consumed: 0.00,
          },
        },
      }
    });

    return res.status(201).json({
      message: 'Organization created successfully.',
      organization: org
    });
  } catch (error) {
    console.error('Create organization error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllOrganizations = async (req, res) => {
  try {
    const organizations = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json({ organizations });
  } catch (error) {
    console.error('Get all organizations error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Public org profile page
 * GET /organizations/:id/profile
 */
const getPublicOrgProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true, name: true, subdomain: true, industry: true, location: true,
        website: true, company_size: true, phone: true, linkedin_url: true,
        twitter_url: true, is_verified: true, description: true,
        logo_url: true, cover_url: true, status: true, createdAt: true,
        internshipPrograms: {
          where: { status: 'OPEN', visibility: 'PUBLIC' },
          select: {
            id: true, title: true, category: true, type: true, is_paid: true,
            deadline: true, location: true, positions: true
          },
          orderBy: { deadline: 'asc' },
          take: 10
        }
      }
    });
    if (!org || org.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Organization not found.' });
    }
    return res.json({ organization: org });
  } catch (error) {
    console.error('Get public org profile error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Top active organizations for homepage
 * GET /organizations/public
 */
const getTopOrganizations = async (req, res) => {
  try {
    const orgs = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, name: true, logo_url: true, industry: true,
        location: true, is_verified: true,
        _count: { select: { internshipPrograms: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });
    return res.json({ organizations: orgs });
  } catch (error) {
    console.error('Get top organizations error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update own organization profile (org admin only)
 * PUT /organizations/profile
 */
const updateOrgProfile = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant context missing.' });

    const {
      name, industry, location, website, company_size, phone,
      linkedin_url, twitter_url, description, logo_url, cover_url
    } = req.body;

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name && { name }),
        ...(industry !== undefined && { industry }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(company_size !== undefined && { company_size }),
        ...(phone !== undefined && { phone }),
        ...(linkedin_url !== undefined && { linkedin_url }),
        ...(twitter_url !== undefined && { twitter_url }),
        ...(description !== undefined && { description }),
        ...(logo_url !== undefined && { logo_url }),
        ...(cover_url !== undefined && { cover_url })
      },
      select: {
        id: true, name: true, industry: true, location: true, website: true,
        company_size: true, phone: true, linkedin_url: true, twitter_url: true,
        description: true, logo_url: true, cover_url: true, is_verified: true
      }
    });

    return res.json({ message: 'Organization profile updated.', organization: updated });
  } catch (error) {
    console.error('Update org profile error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get own org profile (for dashboard settings tab)
 * GET /organizations/my-profile
 */
const getOwnOrgProfile = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant context missing.' });

    const org = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true, name: true, subdomain: true, industry: true, location: true,
        website: true, company_size: true, phone: true, linkedin_url: true,
        twitter_url: true, is_verified: true, description: true,
        logo_url: true, cover_url: true, status: true, tier: true, createdAt: true
      }
    });
    if (!org) return res.status(404).json({ message: 'Organization not found.' });
    return res.json({ organization: org });
  } catch (error) {
    console.error('Get own org profile error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getPublicOrgProfile,
  getTopOrganizations,
  updateOrgProfile,
  getOwnOrgProfile
};
