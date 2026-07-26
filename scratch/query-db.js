const prisma = require('../apps/api-server/src/prisma/client');

async function run() {
  try {
    const tenants = await prisma.tenant.findMany({});
    console.log('TENANTS:', tenants);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        tenant_id: true,
        is_active: true
      }
    });
    console.log('USERS:', users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
