const prisma = require('../apps/api-server/src/prisma/client');
const bcrypt = require('bcryptjs');

async function createSuperadmin() {
  const email = 'superadmin@ims.com';
  const password = 'SuperadminPassword123!';
  const name = 'Global Superadmin';

  try {
    console.log(`Checking if superadmin user exists: ${email}...`);
    const existing = await prisma.user.findFirst({
      where: {
        email,
        role: 'SUPERADMIN'
      }
    });

    if (existing) {
      console.log('✅ Superadmin already exists in the database!');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('Creating global Superadmin (tenant_id = null)...');
    const superadmin = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: 'SUPERADMIN',
        tenant_id: null,
        domain: 'System'
      }
    });

    console.log('✅ Superadmin created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Failed to create superadmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperadmin();
