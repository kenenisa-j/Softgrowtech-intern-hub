const prisma = require('../src/prisma/client');

const createOrganization = async (req, res) => {
  const { name, subdomain } = req.body;
  if (!name || !subdomain) {
    return res.status(400).json({ message: 'Name and subdomain are required.' });
  }

  const normalizedSubdomain = subdomain.trim().toLowerCase();

  try {
    // Check if subdomain is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { subdomain: normalizedSubdomain }
    });
    if (existingOrg) {
      return res.status(400).json({ message: 'Subdomain is already taken.' });
    }

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        subdomain: normalizedSubdomain,
        tenantSettings: {
          create: {
            brand_color_hex: '#6366F1',
            timezone: 'UTC',
          },
        },
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
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    return res.json({ organizations });
  } catch (error) {
    console.error('Get all organizations error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createOrganization,
  getAllOrganizations
};
