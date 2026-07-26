const prisma = require('../apps/api-server/src/prisma/client');

const BASE_URL = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('=== STARTING B2B SAAS REGISTRATION & LOGIN INTEGRATION TESTS ===\n');

  const testSubdomain = 'testacme';
  const testEmail = 'admin@testacme.com';

  // Cleanup any left-over data
  const existingTenant = await prisma.tenant.findUnique({
    where: { subdomain: testSubdomain }
  });
  if (existingTenant) {
    await prisma.user.deleteMany({ where: { tenant_id: existingTenant.id } });
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
    console.log('Cleaned up previous test tenant and users.');
  }

  // TEST 1: Fetch list of organizations (should bypass lock)
  console.log('\n--- Test 1: GET /organizations (Listing organizations) ---');
  const orgsRes = await fetch(`${BASE_URL}/organizations`);
  const orgsData = await orgsRes.json();
  console.log('Status Code:', orgsRes.status);
  console.log('Response:', orgsData);
  if (orgsRes.status !== 200) {
    throw new Error(`Expected GET /organizations to return 200, got ${orgsRes.status}`);
  }
  console.log('✅ GET /organizations passed successfully.');

  // TEST 2: Create a new Organization (should bypass lock and default to PENDING_APPROVAL)
  console.log('\n--- Test 2: POST /organizations (Create organization) ---');
  const createOrgRes = await fetch(`${BASE_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Acme Corp',
      subdomain: testSubdomain
    })
  });
  const createOrgData = await createOrgRes.json();
  console.log('Status Code:', createOrgRes.status);
  console.log('Response:', createOrgData);
  if (createOrgRes.status !== 201) {
    throw new Error(`Expected 201 from organization creation, got ${createOrgRes.status}`);
  }
  const tenantId = createOrgData.organization.id;
  const tenantStatus = createOrgData.organization.status;
  if (tenantStatus !== 'PENDING_APPROVAL') {
    throw new Error(`Expected tenant status to be PENDING_APPROVAL, got ${tenantStatus}`);
  }
  console.log(`✅ Organization created successfully with status: ${tenantStatus}`);

  // TEST 3: Register ORG_ADMIN user under the pending tenant (should bypass lock)
  console.log('\n--- Test 3: POST /auth/register (Register ORG_ADMIN user) ---');
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Acme Admin',
      email: testEmail,
      password: 'password123',
      role: 'ORG_ADMIN',
      domain: 'Management',
      tenantId: tenantId
    })
  });
  const registerData = await registerRes.json();
  console.log('Status Code:', registerRes.status);
  console.log('Response:', registerData);
  if (registerRes.status !== 201) {
    throw new Error(`Expected 201 from user registration, got ${registerRes.status}`);
  }
  if (registerData.user.role !== 'ORG_ADMIN') {
    throw new Error(`Expected user role to be ORG_ADMIN, got ${registerData.user.role}`);
  }
  console.log('✅ User registered successfully under the tenant.');

  // TEST 4: Attempt Login to pending organization (should return 403)
  console.log('\n--- Test 4: POST /auth/login (Attempt pending organization login) ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId
    },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      tenantId: tenantId
    })
  });
  const loginData = await loginRes.json();
  console.log('Status Code:', loginRes.status);
  console.log('Response:', loginData);
  if (loginRes.status !== 403) {
    throw new Error(`Expected 403 from pending login, got ${loginRes.status}`);
  }
  if (!loginData.message.includes('awaiting administrative approval')) {
    throw new Error(`Expected error message to mention "awaiting administrative approval", got: ${loginData.message}`);
  }
  console.log('✅ Login correctly blocked with 403 and pending approval message.');

  // Cleanup test data
  console.log('\n--- Cleaning up test data ---');
  await prisma.user.deleteMany({ where: { tenant_id: tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
  console.log('✅ Cleaned up successfully.');

  console.log('\n=== ALL ONBOARDING FLOW INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests()
  .catch(err => {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
