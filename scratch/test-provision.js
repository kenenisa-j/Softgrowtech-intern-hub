const prisma = require('../apps/api-server/src/prisma/client');
const jwt = require('jsonwebtoken');

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'ORG_ADMIN' } });
  if (!admin) { console.log('No org admin found'); process.exit(0); }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: 'ORG_ADMIN', tenant_id: admin.tenant_id },
    'b49fca92c813a2957b102143df8c7c10b784a91aef',
    { expiresIn: '1h' }
  );

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'X-Tenant-ID': admin.tenant_id
  };

  const program = await prisma.internshipProgram.findFirst({ where: { tenant_id: admin.tenant_id } });
  if (!program) { console.log('No program found under tenant'); process.exit(0); }

  console.log('Provisioning intern to program:', program.title);

  const pRes = await fetch('http://localhost:5001/api/v1/users/provision-intern', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Provisioned Intern Test',
      email: 'prov_intern_test@example.com',
      programId: program.id
    })
  });

  console.log('Provision response status:', pRes.status);
  const pData = await pRes.json();
  console.log('Provision response:', pData);

  const iRes = await fetch('http://localhost:5001/api/v1/users/interns', { headers });
  console.log('Get interns status:', iRes.status);
  const iData = await iRes.json();
  console.log('Intern list sample:', iData.interns?.slice(0, 2));

  if (pRes.status === 201) {
    await prisma.application.deleteMany({ where: { email: 'prov_intern_test@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'prov_intern_test@example.com' } });
    console.log('Cleanup OK.');
  }

  await prisma.$disconnect();
}

run().catch(console.error);
