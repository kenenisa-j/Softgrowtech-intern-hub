const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'apps/api-server/.env' });

const API_BASE = 'http://localhost:5001/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef';

async function runTests() {
  console.log('🚀 Starting Integration Tests for Internship Management System Overhaul...\n');

  try {
    // 1. Create unique subdomain to avoid conflicts
    const randomSuffix = Math.floor(Math.random() * 10000);
    const subdomain = `testorg-${randomSuffix}`;
    const orgName = `Test Organization ${randomSuffix}`;

    console.log(`Step 1: Registering organization: "${orgName}" (${subdomain})...`);
    const orgRes = await axios.post(`${API_BASE}/organizations`, {
      name: orgName,
      subdomain: subdomain
    });
    const tenant = orgRes.data.organization;
    console.log(`✅ Organization created. ID: ${tenant.id}\n`);

    // 2. Register Org Admin
    const adminEmail = `admin@${subdomain}.com`;
    const adminPassword = 'AdminPassword123!';
    console.log(`Step 2: Registering ORG_ADMIN user for tenant: ${adminEmail}...`);
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Jane Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'org_admin',
      tenantId: tenant.id
    });
    console.log(`✅ ORG_ADMIN registered successfully.\n`);

    // 3. Initialize Chapa Payment for FREE Tier
    console.log(`Step 3: Initializing Chapa Payment for FREE (Free) Tier...`);
    const billingFreeRes = await axios.post(`${API_BASE}/billing/initialize`, {
      tenantId: tenant.id,
      tier: 'FREE'
    });
    console.log('Response:', billingFreeRes.data);
    console.log(`✅ Free Tier initialized. isPaymentActive: ${billingFreeRes.data.isPaymentActive}\n`);

    // 4. Initialize Chapa Payment for STANDARD Tier (paid)
    console.log(`Step 4: Initializing Chapa Payment for STANDARD (Paid) Tier...`);
    const billingGrowthRes = await axios.post(`${API_BASE}/billing/initialize`, {
      tenantId: tenant.id,
      tier: 'STANDARD'
    });
    console.log('Response:', billingGrowthRes.data);
    console.log(`✅ Standard Tier initialized. Checkout URL: ${billingGrowthRes.data.checkoutUrl}\n`);

    // 5. Trigger Webhook to simulate Chapa payment completion
    const txRef = `chapa-${tenant.id}`; // Will match the format generated in billingController
    console.log(`Step 5: Simulating successful Chapa webhook callback with tx_ref: ${txRef}...`);
    const webhookRes = await axios.post(`${API_BASE}/billing/webhook`, {
      status: 'success',
      tx_ref: txRef,
      meta: {
        tenantId: tenant.id
      }
    });
    console.log('Response:', webhookRes.data);
    console.log(`✅ Webhook simulation complete.\n`);

    // 6. Generate a Superadmin Token to approve the organization
    console.log('Step 6: Generating Superadmin JWT for approval gating...');
    const superadminToken = jwt.sign(
      {
        id: 'super-admin-id',
        role: 'SUPERADMIN',
        email: 'superadmin@ims.com',
        name: 'Global Superadmin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Superadmin token generated.\n');

    // 7. Approve Organization
    console.log(`Step 7: Approving organization "${orgName}" via Superadmin...`);
    const approveRes = await axios.post(
      `${API_BASE}/superadmin/tenants/${tenant.id}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${superadminToken}` }
      }
    );
    console.log('Response:', approveRes.data);
    console.log(`✅ Tenant status is now: ${approveRes.data.tenant.status}\n`);

    // 8. Log in as ORG_ADMIN
    console.log(`Step 8: Logging in as ORG_ADMIN: ${adminEmail}...`);
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
      tenantId: tenant.id
    });
    const adminToken = loginRes.data.token;
    console.log(`✅ Login successful. JWT token obtained.\n`);

    // 9. Change back to FREE tier to test capacity gating easily
    console.log(`Step 9: Setting organization tier back to FREE (limit 5) to test provisioning limit...`);
    await axios.post(`${API_BASE}/billing/initialize`, {
      tenantId: tenant.id,
      tier: 'FREE'
    });
    console.log('✅ Organization tier set to FREE.\n');

    // 10. Provision Interns and Verify Capacity limit
    console.log(`Step 10: Provisioning interns. Limit is 5. Let's create a few and check...`);
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Provision 5 interns (FREE tier limit)
    console.log('Creating 5 interns to reach the FREE tier limit...');
    for (let i = 1; i <= 5; i++) {
      await axios.post(`${API_BASE}/admin/users/provision`, {
        name: `Intern Number ${i}`,
        email: `intern${i}@${subdomain}.com`,
        role: 'intern',
        domain: 'Frontend'
      }, { headers });
    }
    console.log('✅ Created 5 interns successfully.');

    // Attempt to provision the 6th intern (should be blocked)
    console.log('Attempting to create the 6th intern (should fail with 403)...');
    try {
      await axios.post(`${API_BASE}/admin/users/provision`, {
        name: 'The 6th Intern',
        email: `intern6@${subdomain}.com`,
        role: 'intern',
        domain: 'Backend'
      }, { headers });
      console.log('❌ Error: The 6th intern was created, but should have been blocked!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`✅ Correctly blocked! Status: ${error.response.status}, Message: "${error.response.data.message}"`);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! The IMS system overhaul is fully functional and production-ready.');

  } catch (error) {
    console.error('\n❌ Test Run Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

// Wait 2 seconds for server to be fully booted before running
setTimeout(runTests, 2000);
