const prisma = require('../apps/api-server/src/prisma/client');

const BASE_URL = 'http://localhost:5002/api/v1';

async function runTests() {
  console.log('=== STARTING ADMIN-DRIVEN USER PROVISIONING VERIFICATION ===\n');

  // 1. Setup test organization in the DB
  const orgSubdomain = 'testprovision';
  
  let org = await prisma.tenant.findUnique({
    where: { subdomain: orgSubdomain }
  });

  if (org) {
    // Clear existing users first to ensure a clean state
    await prisma.user.deleteMany({ where: { tenant_id: org.id } });
    await prisma.tenant.delete({ where: { id: org.id } });
  }

  org = await prisma.tenant.create({
    data: {
      name: 'Test Provision Org',
      subdomain: orgSubdomain,
      status: 'ACTIVE',
      tenantSettings: {
        create: {
          brand_color_hex: '#3B82F6',
          timezone: 'UTC'
        }
      }
    }
  });

  console.log(`Created test organization: ${org.name} (ID: ${org.id})`);

  // Create an ORG_ADMIN user directly via DB to act as the authorized user
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const adminUser = await prisma.user.create({
    data: {
      tenant_id: org.id,
      name: 'Test Admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'ORG_ADMIN' // Enum in database
    }
  });
  console.log(`Created ORG_ADMIN user: ${adminUser.email}`);

  // Let's log in the admin to get JWT
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': org.id
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Failed to login admin: ${JSON.stringify(loginData)}`);
  }
  const adminToken = loginData.token;
  console.log('Admin logged in successfully. JWT obtained.');

  // ==========================================
  // TEST 1: Provision a MENTOR user (Success)
  // ==========================================
  console.log('\n--- Test 1: Provisioning a MENTOR user ---');
  const provisionRes1 = await fetch(`${BASE_URL}/admin/users/provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Staff Mentor',
      email: 'staff@example.com',
      role: 'MENTOR',
      domain: 'Web Development'
    })
  });

  const provisionData1 = await provisionRes1.json();
  console.log(`Response Status: ${provisionRes1.status}`);
  console.log(`Response Body:`, provisionData1);

  if (provisionRes1.status !== 201) {
    throw new Error(`Expected status 201 when provisioning user, got ${provisionRes1.status}`);
  }
  if (provisionData1.user.role !== 'MENTOR') {
    throw new Error(`Expected role to be MENTOR, got ${provisionData1.user.role}`);
  }
  console.log('✅ Successfully provisioned mentor user.');

  // ==========================================
  // TEST 2: Provision an INTERN user (Success)
  // ==========================================
  console.log('\n--- Test 2: Provisioning an INTERN user ---');
  const provisionRes2 = await fetch(`${BASE_URL}/admin/users/provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Student Intern',
      email: 'student@example.com',
      role: 'INTERN',
      domain: 'UI/UX Design'
    })
  });

  const provisionData2 = await provisionRes2.json();
  console.log(`Response Status: ${provisionRes2.status}`);
  console.log(`Response Body:`, provisionData2);

  if (provisionRes2.status !== 201) {
    throw new Error(`Expected status 201 when provisioning user, got ${provisionRes2.status}`);
  }
  if (provisionData2.user.role !== 'INTERN') {
    throw new Error(`Expected role to be INTERN, got ${provisionData2.user.role}`);
  }
  console.log('✅ Successfully provisioned intern user.');

  // ==========================================
  // TEST 3: Block unauthorized access (Role check)
  // ==========================================
  console.log('\n--- Test 3: Blocking unauthorized users from provisioning ---');
  // Log in as the newly provisioned INTERN (by logging in with default temp password)
  const internLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': org.id
    },
    body: JSON.stringify({
      email: 'student@example.com',
      password: 'Welcome123!'
    })
  });

  const internLoginData = await internLoginRes.json();
  if (internLoginRes.status !== 200) {
    throw new Error(`Failed to login provisioned intern user: ${JSON.stringify(internLoginData)}`);
  }
  const internToken = internLoginData.token;

  // Try to provision a user as the INTERN
  const hackRes = await fetch(`${BASE_URL}/admin/users/provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${internToken}`
    },
    body: JSON.stringify({
      name: 'Hacker User',
      email: 'hacker@example.com',
      role: 'MENTOR'
    })
  });

  const hackData = await hackRes.json();
  console.log(`Response Status: ${hackRes.status}`);
  console.log(`Response Body:`, hackData);

  if (hackRes.status !== 403) {
    throw new Error(`Expected status 403 when trying to access admin endpoint as intern, got ${hackRes.status}`);
  }
  console.log('✅ Correctly blocked intern from provisioning.');

  // ==========================================
  // TEST 4: Get and audit tenant users
  // ==========================================
  console.log('\n--- Test 4: Auditing Tenant Users ---');
  const listRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const listData = await listRes.json();
  console.log(`Response Status: ${listRes.status}`);
  console.log(`Users Found:`, listData.users.length);
  console.log(`Users List:`, listData.users);

  if (listRes.status !== 200) {
    throw new Error(`Expected status 200, got ${listRes.status}`);
  }
  if (listData.users.length !== 3) {
    throw new Error(`Expected 3 users under the tenant (admin, mentor, intern), got ${listData.users.length}`);
  }
  console.log('✅ Successfully listed and audited tenant users.');

  // Cleanup test data
  await prisma.user.deleteMany({ where: { tenant_id: org.id } });
  await prisma.tenant.delete({ where: { id: org.id } });
  console.log('\nCleanup finished.');

  console.log('\n=== ALL PHASE 4 PROVISIONING API TESTS PASSED SUCCESSFULLY! ===');
}

runTests()
  .catch(err => {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
