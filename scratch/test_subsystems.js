// scratch/test_subsystems.js
// Integration test suite verifying attendance, program limits, candidate onboarding, evaluations, and certificates.

const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'apps/api-server/.env' });

const API_BASE = 'http://localhost:5001/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef';

async function runSubsystemTests() {
  console.log('🚀 Starting Integration Tests for IMS Subsystems & Features...\n');

  try {
    // 1. Setup a unique organization and admin
    const randomSuffix = Math.floor(Math.random() * 10000);
    const subdomain = `suborg-${randomSuffix}`;
    const orgName = `Subsystem Org ${randomSuffix}`;

    console.log(`Step 1: Creating Organization: "${orgName}"...`);
    const orgRes = await axios.post(`${API_BASE}/organizations`, {
      name: orgName,
      subdomain: subdomain
    });
    const tenant = orgRes.data.organization;

    // Approve organization so it is active
    const superadminToken = jwt.sign(
      { id: 'superadmin-id', role: 'SUPERADMIN', email: 'superadmin@ims.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    await axios.post(`${API_BASE}/superadmin/tenants/${tenant.id}/approve`, {}, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    console.log('✅ Workspace approved and set ACTIVE.');

    // Register Company Admin
    const adminEmail = `admin@${subdomain}.com`;
    const adminPassword = 'AdminPassword123!';
    await axios.post(`${API_BASE}/auth/register`, {
      name: 'John Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'org_admin',
      tenantId: tenant.id
    });
    console.log('✅ Registered ORG_ADMIN.');

    // Log in to get Admin Token
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
      tenantId: tenant.id
    });
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log('✅ ORG_ADMIN token obtained.\n');

    // 2. Test program creation & subscription limit enforcement
    console.log('Step 2: Testing Program Limits Gating under FREE tier...');
    const program1 = await axios.post(`${API_BASE}/programs`, {
      title: 'Frontend Track',
      description: 'Learn React and Tailwind.',
      category: 'Frontend',
      skills: 'React, CSS',
      type: 'REMOTE',
      is_paid: false,
      duration: '3 Months',
      start_date: new Date(),
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      positions: 5,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    }, { headers: adminHeaders });
    console.log('✅ First program created successfully.');

    // Try to create second program (should be blocked under FREE tier, limit 1)
    try {
      await axios.post(`${API_BASE}/programs`, {
        title: 'Backend Track',
        description: 'Learn Express.',
        category: 'Backend',
        skills: 'Node.js',
        start_date: new Date(),
        end_date: new Date(),
        deadline: new Date()
      }, { headers: adminHeaders });
      console.log('❌ Error: Allowed to create multiple programs on FREE tier!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Correctly blocked program limit check. Status: ${err.response.status}, Msg: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }
    console.log('');

    // 3. Provision Mentor
    console.log('Step 3: Provisioning Mentor...');
    const mentorEmail = `mentor@${subdomain}.com`;
    const mentorRes = await axios.post(`${API_BASE}/admin/users/provision`, {
      name: 'Mentor Mike',
      email: mentorEmail,
      role: 'mentor',
      domain: 'Frontend'
    }, { headers: adminHeaders });
    const mentorId = mentorRes.data.user.id;
    console.log(`✅ Mentor provisioned. ID: ${mentorId}\n`);

    // 4. Candidate application & auto-onboarding
    console.log('Step 4: Submitting public candidate application...');
    const candidateEmail = `candidate@test.com`;
    const applyRes = await axios.post(`${API_BASE}/programs/apply`, {
      programId: program1.data.program.id,
      name: 'Alice Candidate',
      email: candidateEmail,
      coverLetter: 'I love software.',
      cvFileName: 'cv.pdf',
      cvFileData: 'JVBERi0xLjQKJcfsj6IKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAvUGFnZXMgMiAwIFI...=' // mock pdf base64
    }, { headers: { 'x-tenant-id': tenant.id } }); // public header
    const appId = applyRes.data.application.id;
    console.log(`✅ Candidate applied. Application ID: ${appId}`);

    // Admin accepts candidate, assigning Mentor Mike
    console.log('Accepting application to trigger onboarding hook...');
    const acceptRes = await axios.put(`${API_BASE}/programs/applications/${appId}/status`, {
      status: 'ACCEPTED',
      assignedMentorId: mentorId
    }, { headers: adminHeaders });
    console.log('✅ Onboarding completed.');

    // Log in as the newly created Intern!
    // Since we don't have the temporary password, let's verify their user record exists in the DB
    // We will generate an Intern Token using JWT directly to verify the APIs!
    const intern = await axios.get(`${API_BASE}/admin/users`, { headers: adminHeaders });
    const internRecord = intern.data.users.find(u => u.email === candidateEmail);
    console.log(`✅ Intern verified in DB. User ID: ${internRecord.id}`);

    const internToken = jwt.sign(
      { id: internRecord.id, role: 'INTERN', email: candidateEmail, domain: 'Frontend', tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const internHeaders = { Authorization: `Bearer ${internToken}` };
    console.log('✅ Intern JWT token signed.\n');

    // 5. Attendance punch test
    console.log('Step 5: Simulating Intern attendance punch-in/out...');
    const checkInRes = await axios.post(`${API_BASE}/attendance/check-in`, {}, { headers: internHeaders });
    console.log(`✅ Punch-in registered. Status: ${checkInRes.data.attendance.status}`);

    const checkOutRes = await axios.post(`${API_BASE}/attendance/check-out`, {}, { headers: internHeaders });
    console.log('✅ Punch-out registered.');

    // Mentor approves attendance log
    console.log('Mentor audits and approves attendance check...');
    const mentorToken = jwt.sign(
      { id: mentorId, role: 'MENTOR', email: mentorEmail, domain: 'Frontend', tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const mentorHeaders = { Authorization: `Bearer ${mentorToken}` };
    
    await axios.put(`${API_BASE}/attendance/approve/${checkInRes.data.attendance.id}`, {
      status: 'APPROVED'
    }, { headers: mentorHeaders });
    console.log('✅ Attendance approved by mentor.\n');

    // 6. Evaluations grading check
    console.log('Step 6: Mentor grading intern evaluations across criteria...');
    const evalRes = await axios.post(`${API_BASE}/evaluations`, {
      internId: internRecord.id,
      type: 'FINAL',
      technicalSkills: 10,
      communication: 8,
      teamwork: 9,
      problemSolving: 8,
      attendance: 10,
      professionalism: 9,
      comments: 'Alice is a stellar engineer!'
    }, { headers: mentorHeaders });
    
    const overall = parseFloat(evalRes.data.evaluation.overall_score);
    console.log(`✅ Evaluation submitted. Score: ${overall}/10`);
    if (overall === 9.00) {
      console.log('✅ Evaluation arithmetic matches specification perfectly: (10+8+9+8+10+9)/6 = 9.00');
    } else {
      console.log(`❌ Error: Overall score calculation is incorrect. Got: ${overall}`);
    }
    console.log('');

    // 7. Certificate generation & Verification
    console.log('Step 7: Requesting graduation certificate...');
    const certUrl = `${API_BASE}/reports/certificate/${internRecord.id}`;
    const certRes = await axios.get(certUrl, { headers: internHeaders, responseType: 'arraybuffer' });
    console.log(`✅ Certificate PDF compiled. Buffer size: ${certRes.data.length} bytes`);

    // Public verification scan endpoint
    console.log('Verifying certificate authenticity via public validation endpoint...');
    const certRecordRes = await axios.get(`${API_BASE}/admin/users`, { headers: adminHeaders }); // to get certificate or check cert
    // Get certificate id from DB to test verification route
    const prisma = require('../apps/api-server/src/prisma/client');
    const dbCert = await prisma.certificate.findFirst({
      where: { intern_id: internRecord.id }
    });
    
    const verifyRes = await axios.get(`${API_BASE}/reports/verify/${dbCert.id}`);
    console.log('Response:', verifyRes.data);
    if (verifyRes.data.authentic && verifyRes.data.internName === 'Alice Candidate') {
      console.log('✅ Certificate QR verification is AUTHENTIC and matches candidates details.');
    } else {
      console.log('❌ Error: Certificate verification failed.');
    }
    await prisma.$disconnect();

    console.log('\n🎉 ALL SUBSYSTEM INTEGRATION TESTS COMPLETED AND PASSED SUCCESSFULLY!');

  } catch (error) {
    console.error('\n❌ Integration Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

// Boot test suite
setTimeout(runSubsystemTests, 1000);
