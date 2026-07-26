const prisma = require('../apps/api-server/src/prisma/client');

async function test() {
  try {
    let tenant = await prisma.tenant.findFirst();
    
    // Try to create a user with lowercase 'mentor'
    const user2 = await prisma.user.create({
      data: {
        tenant_id: tenant.id,
        name: 'Lowercase Mentor',
        email: 'lower-test@example.com',
        password_hash: 'hash',
        role: 'mentor', // Lowercase
      }
    });
    console.log('Created mentor user successfully:', user2.role);
    await prisma.user.delete({ where: { id: user2.id } });
  } catch (err) {
    console.error('ERROR in test:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
