const prisma = require('../apps/api-server/src/prisma/client');

async function testStudentRegister() {
  const email = 'test_student_unique@example.com';
  
  // Clean up
  await prisma.user.deleteMany({ where: { email } });
  
  const BASE_URL = 'http://localhost:5001/api/v1';
  
  console.log('Sending register request for student...');
  const res = await fetch(`${BASE_URL}/students/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Student',
      email: email,
      password: 'securepassword123',
      university: 'Addis Ababa University',
      department: 'Computer Science'
    })
  });
  
  const data = await res.json();
  console.log('Status Code:', res.status);
  console.log('Response:', data);
}

testStudentRegister()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
