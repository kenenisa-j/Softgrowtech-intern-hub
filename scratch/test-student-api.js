const prisma = require('../apps/api-server/src/prisma/client');
const jwt = require('jsonwebtoken');

async function test() {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) { console.log('No student found in DB'); process.exit(0); }
  
  console.log('Testing with student:', student.email);
  
  const token = jwt.sign(
    { id: student.id, email: student.email, role: 'STUDENT', tenant_id: null },
    'b49fca92c813a2957b102143df8c7c10b784a91aef',
    { expiresIn: '1h' }
  );
  
  const headers = { Authorization: 'Bearer ' + token };
  
  const [pRes, aRes, sRes] = await Promise.all([
    fetch('http://localhost:5001/api/v1/students/profile', { headers }),
    fetch('http://localhost:5001/api/v1/students/applications', { headers }),
    fetch('http://localhost:5001/api/v1/students/saved', { headers }),
  ]);
  
  const [profile, apps, saved] = await Promise.all([pRes.json(), aRes.json(), sRes.json()]);
  
  console.log('Profile status:', pRes.status, '| keys:', Object.keys(profile));
  console.log('Applications status:', aRes.status, '| keys:', Object.keys(apps));
  console.log('Saved status:', sRes.status, '| keys:', Object.keys(saved));
  console.log('\nAll routes OK:', pRes.status === 200 && aRes.status === 200 && sRes.status === 200 ? '✅' : '❌');
  
  await prisma.$disconnect();
}

test().catch(e => { console.error('Test error:', e.message); process.exit(1); });
