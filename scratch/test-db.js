const { register, login } = require('../apps/api-server/controllers/authController');
const prisma = require('../apps/api-server/src/prisma/client');
const tenantResolver = require('../apps/api-server/src/middlewares/tenantResolver');

async function test() {
  console.log('--- Testing Auth Controller with Prisma and Fallback Tenant ---');

  // Clear existing users from test
  await prisma.user.deleteMany({
    where: { email: 'test_user@example.com' }
  });

  // Mock request and response for tenantResolver
  const req1 = {
    headers: {},
    url: '/api/v1/auth/register'
  };
  const res1 = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };

  // Run tenantResolver middleware
  await tenantResolver(req1, res1, () => {});
  console.log('Resolved Tenant ID:', req1.tenantId);

  // Mock request for registration
  const req2 = {
    tenantId: req1.tenantId,
    body: {
      name: 'Test User',
      email: 'test_user@example.com',
      password: 'securepassword123',
      role: 'intern',
      domain: 'Full-Stack'
    }
  };

  const res2 = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };

  // Call register
  await register(req2, res2);
  console.log('Registration Status:', res2.statusCode);
  console.log('Registration Response:', res2.body);

  if (res2.statusCode !== 201) {
    throw new Error('Registration failed!');
  }

  // Mock request for login
  const req3 = {
    body: {
      email: 'test_user@example.com',
      password: 'securepassword123'
    }
  };

  const res3 = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };

  // Call login
  await login(req3, res3);
  console.log('Login Status:', res3.statusCode);
  console.log('Login Response:', res3.body);

  if (res3.statusCode !== 200) {
    throw new Error('Login failed!');
  }

  console.log('✅ Auth and Tenant Fallback tests passed successfully!');
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
