const prisma = require('../apps/api-server/src/prisma/client');

const BASE_URL = 'http://localhost:5002/api/v1';

async function runTests() {
  console.log('=== STARTING DUAL-ONBOARDING SYSTEM ARCHITECTURE VERIFICATION ===\n');

  // 1. Setup test organization in the DB
  const orgSubdomain = 'testonboarding';
  
  let org = await prisma.organization.findUnique({
    where: { subdomain: orgSubdomain }
  });

  if (org) {
    // Clear existing users/invitations first to ensure a clean state
    await prisma.invitation.deleteMany({ where: { tenant_id: org.id } });
    await prisma.user.deleteMany({ where: { tenant_id: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  }

  org = await prisma.organization.create({
    data: {
      name: 'Test Onboarding Org',
      subdomain: orgSubdomain,
      onboardingMode: 'PRIVATE', // start with PRIVATE
      status: 'ACTIVE',
      tenantSettings: {
        create: {
          brand_color_hex: '#10B981',
          timezone: 'UTC'
        }
      }
    }
  });

  console.log(`Created test organization: ${org.name} (ID: ${org.id}, onboardingMode: ${org.onboardingMode})`);

  // Create a mentor user directly via DB to act as the authorized user
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const mentorUser = await prisma.user.create({
    data: {
      tenant_id: org.id,
      name: 'Test Mentor',
      email: 'mentor@example.com',
      password_hash: passwordHash,
      role: 'mentor',
      status: 'ACCEPTED'
    }
  });
  console.log(`Created mentor user: ${mentorUser.email}`);

  // Let's log in the mentor to get JWT
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': org.id
    },
    body: JSON.stringify({
      email: 'mentor@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Failed to login mentor: ${JSON.stringify(loginData)}`);
  }
  const mentorToken = loginData.token;
  console.log('Mentor logged in successfully. JWT obtained.');

  // ==========================================
  // TEST 1: Public application in PRIVATE mode
  // ==========================================
  console.log('\n--- Test 1: Public Application under PRIVATE Mode ---');
  const applyRes1 = await fetch(`${BASE_URL}/tenants/${orgSubdomain}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Public Applicant',
      email: 'applicant@example.com',
      password: 'password123'
    })
  });

  const applyData1 = await applyRes1.json();
  console.log(`Response Status: ${applyRes1.status}`);
  console.log(`Response Body:`, applyData1);

  if (applyRes1.status !== 403) {
    throw new Error(`Expected status 403 when applying to private tenant, got ${applyRes1.status}`);
  }
  console.log('✅ Correctly rejected public application in PRIVATE mode.');

  // ==========================================
  // TEST 2: Public application in PUBLIC mode
  // ==========================================
  console.log('\n--- Test 2: Public Application under PUBLIC Mode ---');
  // Update organization onboardingMode to PUBLIC
  await prisma.organization.update({
    where: { id: org.id },
    data: { onboardingMode: 'PUBLIC' }
  });
  console.log('Updated organization onboardingMode to PUBLIC.');

  const applyRes2 = await fetch(`${BASE_URL}/tenants/${orgSubdomain}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Public Applicant',
      email: 'applicant@example.com',
      password: 'password123',
      domain: 'Backend'
    })
  });

  const applyData2 = await applyRes2.json();
  console.log(`Response Status: ${applyRes2.status}`);
  console.log(`Response Body:`, applyData2);

  if (applyRes2.status !== 201) {
    throw new Error(`Expected status 201 when applying to public tenant, got ${applyRes2.status}`);
  }
  if (applyData2.status !== 'PENDING') {
    throw new Error(`Expected status to be PENDING, got ${applyData2.status}`);
  }
  console.log('✅ Correctly accepted public application and set status to PENDING.');

  // ==========================================
  // TEST 3: Application Guard blocks PENDING
  // ==========================================
  console.log('\n--- Test 3: Application Guard blocking PENDING intern ---');
  // Log in as the public applicant (PENDING status)
  const applicantLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': org.id
    },
    body: JSON.stringify({
      email: 'applicant@example.com',
      password: 'password123'
    })
  });

  const applicantLoginData = await applicantLoginRes.json();
  if (applicantLoginRes.status !== 200) {
    throw new Error(`Failed to login applicant user: ${JSON.stringify(applicantLoginData)}`);
  }
  const applicantToken = applicantLoginData.token;

  // Attempt to view tasks (protected route)
  const tasksRes = await fetch(`${BASE_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${applicantToken}`
    }
  });

  const tasksData = await tasksRes.json();
  console.log(`Access Tasks Status: ${tasksRes.status}`);
  console.log(`Access Tasks Body:`, tasksData);

  if (tasksRes.status !== 403) {
    throw new Error(`Expected status 403 when accessing tasks with PENDING status, got ${tasksRes.status}`);
  }
  if (tasksData.error !== 'Access Denied' || tasksData.status !== 'PENDING_REVIEW') {
    throw new Error(`Expected applicationGuard error structure, got ${JSON.stringify(tasksData)}`);
  }
  console.log('✅ Correctly blocked PENDING intern via applicationGuard.');

  // ==========================================
  // TEST 4: Invitation Engine (Pattern B)
  // ==========================================
  console.log('\n--- Test 4: Generating and Registering via Invitation Token ---');
  // Mentor invites an intern
  const inviteRes = await fetch(`${BASE_URL}/mentors/invite-intern`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      email: 'invited@example.com'
    })
  });

  const inviteData = await inviteRes.json();
  console.log(`Invite Status: ${inviteRes.status}`);
  console.log(`Invite Body:`, inviteData);

  if (inviteRes.status !== 201) {
    throw new Error(`Expected invite status 201, got ${inviteRes.status}`);
  }
  const inviteToken = inviteData.invitation.token;

  // Complete registration using token
  const registerInviteRes = await fetch(`${BASE_URL}/auth/register/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: inviteToken,
      name: 'Invited Intern',
      password: 'password123',
      domain: 'Frontend'
    })
  });

  const registerInviteData = await registerInviteRes.json();
  console.log(`Register Invite Status: ${registerInviteRes.status}`);
  console.log(`Register Invite Body:`, registerInviteData);

  if (registerInviteRes.status !== 201) {
    throw new Error(`Expected register invite status 201, got ${registerInviteRes.status}`);
  }
  if (registerInviteData.status !== 'ACCEPTED') {
    throw new Error(`Expected status to be ACCEPTED, got ${registerInviteData.status}`);
  }

  // Verify that the token is marked as accepted/used
  const dbInvite = await prisma.invitation.findFirst({
    where: { token: inviteToken }
  });
  if (!dbInvite.is_accepted) {
    throw new Error('Expected invitation to be marked as accepted.');
  }
  console.log('✅ Successfully onboarded intern via invitation token with instant ACCEPTED status.');

  // ==========================================
  // TEST 5: Recruitment Evaluation Controller
  // ==========================================
  console.log('\n--- Test 5: Evaluating (Accepting) PENDING Applicant ---');
  // Get applicant user ID
  const applicantUser = await prisma.user.findFirst({
    where: { email: 'applicant@example.com', tenant_id: org.id }
  });

  // Evaluate application
  const evalRes = await fetch(`${BASE_URL}/mentors/applications/${applicantUser.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      status: 'ACCEPTED'
    })
  });

  const evalData = await evalRes.json();
  console.log(`Evaluate Status: ${evalRes.status}`);
  console.log(`Evaluate Body:`, evalData);

  if (evalRes.status !== 200) {
    throw new Error(`Expected evaluate status 200, got ${evalRes.status}`);
  }

  // Log in again as the applicant to get updated JWT payload with status 'ACCEPTED'
  const applicantLoginRes2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': org.id
    },
    body: JSON.stringify({
      email: 'applicant@example.com',
      password: 'password123'
    })
  });
  const applicantLoginData2 = await applicantLoginRes2.json();
  const acceptedApplicantToken = applicantLoginData2.token;

  // Try to access tasks again
  const tasksRes2 = await fetch(`${BASE_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${acceptedApplicantToken}`
    }
  });

  console.log(`Access Tasks (After ACCEPTED) Status: ${tasksRes2.status}`);
  if (tasksRes2.status !== 200 && tasksRes2.status !== 404) {
    throw new Error(`Expected access permitted (200 or 404), got ${tasksRes2.status}`);
  }
  console.log('✅ Successfully evaluated applicant, bypassing applicationGuard after approval.');

  // Cleanup test data
  await prisma.invitation.deleteMany({ where: { tenant_id: org.id } });
  await prisma.user.deleteMany({ where: { tenant_id: org.id } });
  await prisma.organization.delete({ where: { id: org.id } });
  console.log('\nCleanup finished.');

  console.log('\n=== ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests()
  .catch(err => {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
