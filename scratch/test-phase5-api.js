const prisma = require('../apps/api-server/src/prisma/client');

const BASE_URL = 'http://localhost:5002/api/v1';

async function runTests() {
  console.log('=== STARTING PHASE 5 WEB WORKSPACE API VERIFICATION ===\n');

  // Find or create test organization
  const orgSubdomain = 'testphase5';
  let org = await prisma.organization.findUnique({
    where: { subdomain: orgSubdomain }
  });

  if (org) {
    await prisma.user.deleteMany({ where: { tenant_id: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  }

  org = await prisma.organization.create({
    data: {
      name: 'Test Phase 5 Org',
      subdomain: orgSubdomain,
      onboardingMode: 'PRIVATE',
      status: 'ACTIVE',
      tenantSettings: {
        create: {
          brand_color_hex: '#6366F1',
          timezone: 'UTC'
        }
      }
    }
  });

  console.log(`Created test organization: ${org.name}`);

  // Create mentor user
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const mentorUser = await prisma.user.create({
    data: {
      tenant_id: org.id,
      name: 'Test Admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'admin',
      status: 'ACCEPTED'
    }
  });
  console.log(`Created admin user: ${mentorUser.email}`);

  // Create pending intern user
  const internUser = await prisma.user.create({
    data: {
      tenant_id: org.id,
      name: 'Pending Intern',
      email: 'pending@example.com',
      password_hash: passwordHash,
      role: 'intern',
      status: 'PENDING'
    }
  });
  console.log(`Created pending intern: ${internUser.email}`);

  // Log in the Admin to get JWT
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
  const adminToken = loginData.token;

  // Log in the Intern to get JWT
  const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': org.id
    },
    body: JSON.stringify({
      email: 'pending@example.com',
      password: 'password123'
    })
  });
  const loginData2 = await loginRes2.json();
  const internToken = loginData2.token;

  // ==========================================
  // TEST 1: GET /tenant/settings
  // ==========================================
  console.log('\n--- Test 1: Fetching Tenant Settings ---');
  const getSettingsRes = await fetch(`${BASE_URL}/tenant/settings`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const getSettingsData = await getSettingsRes.json();
  console.log('Status Code:', getSettingsRes.status);
  console.log('Response:', getSettingsData);

  if (getSettingsRes.status !== 200) {
    throw new Error('Expected status code 200');
  }
  if (getSettingsData.onboardingMode !== 'PRIVATE') {
    throw new Error(`Expected onboardingMode to be PRIVATE, got ${getSettingsData.onboardingMode}`);
  }
  console.log('✅ Successfully fetched onboarding settings.');

  // ==========================================
  // TEST 2: PATCH /tenant/settings
  // ==========================================
  console.log('\n--- Test 2: Updating Tenant Settings ---');
  const patchSettingsRes = await fetch(`${BASE_URL}/tenant/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      onboardingMode: 'PUBLIC'
    })
  });
  const patchSettingsData = await patchSettingsRes.json();
  console.log('Status Code:', patchSettingsRes.status);
  console.log('Response:', patchSettingsData);

  if (patchSettingsRes.status !== 200) {
    throw new Error('Expected status code 200');
  }
  if (patchSettingsData.onboardingMode !== 'PUBLIC') {
    throw new Error('Failed to update onboardingMode to PUBLIC');
  }
  console.log('✅ Successfully updated onboarding settings to PUBLIC.');

  // ==========================================
  // TEST 3: GET /auth/status for Admin
  // ==========================================
  console.log('\n--- Test 3: Fetching Status for Admin ---');
  const adminStatusRes = await fetch(`${BASE_URL}/auth/status`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const adminStatusData = await adminStatusRes.json();
  console.log('Status Code:', adminStatusRes.status);
  console.log('Response:', adminStatusData);

  if (adminStatusRes.status !== 200) {
    throw new Error('Expected status code 200');
  }
  if (adminStatusData.status !== 'ACCEPTED') {
    throw new Error(`Expected ACCEPTED, got ${adminStatusData.status}`);
  }
  console.log('✅ Successfully fetched Admin status.');

  // ==========================================
  // TEST 4: GET /auth/status for Intern
  // ==========================================
  console.log('\n--- Test 4: Fetching Status for Intern ---');
  const internStatusRes = await fetch(`${BASE_URL}/auth/status`, {
    headers: {
      'Authorization': `Bearer ${internToken}`
    }
  });
  const internStatusData = await internStatusRes.json();
  console.log('Status Code:', internStatusRes.status);
  console.log('Response:', internStatusData);

  if (internStatusRes.status !== 200) {
    throw new Error('Expected status code 200');
  }
  if (internStatusData.status !== 'PENDING') {
    throw new Error(`Expected PENDING, got ${internStatusData.status}`);
  }
  console.log('✅ Successfully fetched Intern status.');

  // Cleanup test data
  await prisma.user.deleteMany({ where: { tenant_id: org.id } });
  await prisma.organization.delete({ where: { id: org.id } });
  console.log('\nCleanup finished.');

  console.log('\n=== ALL PHASE 5 API INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests()
  .catch(err => {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
