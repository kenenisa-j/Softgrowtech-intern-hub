const prisma = require('../apps/api-server/src/prisma/client');
const jwt = require('jsonwebtoken');

async function testCreate() {
  // Find an admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ORG_ADMIN' }
  });
  if (!admin) {
    console.log('No ORG_ADMIN user found.');
    process.exit(0);
  }
  
  console.log('Testing with ORG_ADMIN:', admin.email, 'tenant:', admin.tenant_id);
  
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: 'ORG_ADMIN', tenant_id: admin.tenant_id },
    'b49fca92c813a2957b102143df8c7c10b784a91aef',
    { expiresIn: '1h' }
  );
  
  const res = await fetch('http://localhost:5001/api/v1/programs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'X-Tenant-ID': admin.tenant_id
    },
    body: JSON.stringify({
      title: 'Backend Node.js Internship',
      description: 'Learn Node.js, Express, and Prisma.',
      category: 'Software Engineering',
      skills: ['Node.js', 'Prisma', 'MySQL'],
      type: 'REMOTE',
      is_paid: true,
      stipend: '$500',
      duration: '3 Months',
      start_date: '2026-08-01',
      end_date: '2026-11-01',
      positions: 3,
      deadline: '2026-07-31',
      visibility: 'PUBLIC'
    })
  });
  
  const data = await res.json();
  console.log('Response Status:', res.status);
  console.log('Response Body:', data);
  
  await prisma.$disconnect();
}

testCreate().catch(console.error);
