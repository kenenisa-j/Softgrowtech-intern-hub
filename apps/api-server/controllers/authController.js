const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../src/prisma/client');
const { sendEmail } = require('../src/utils/email');

const register = async (req, res) => {
  const { name, email, password, role, domain, tenantId: bodyTenantId } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
  }

  // Map incoming role to Prisma enum values
  const roleMap = {
    superadmin: 'SUPERADMIN',
    orgadmin: 'ORG_ADMIN',
    org_admin: 'ORG_ADMIN',
    mentor: 'MENTOR',
    intern: 'INTERN'
  };

  const roleKey = role.toString().toLowerCase().replace('_', '');
  const mappedRole = roleMap[roleKey];

  if (!mappedRole) {
    return res.status(400).json({ message: `Invalid role provided: ${role}` });
  }

  const userDomain = domain || 'Full-Stack';

  try {
    // Get tenant ID from request (resolved by tenantResolver middleware or provided in body)
    const tenantId = bodyTenantId || req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing.' });
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenant_id: tenantId }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email in the selected organization.' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into the users table using Prisma
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: mappedRole,
        domain: userDomain,
        tenant_id: tenantId
      }
    });

    const org = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    const tenantName = org ? org.name : 'Unknown Organization';

    const user = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      domain: createdUser.domain,
      tenant_id: createdUser.tenant_id,
      tenant_name: tenantName,
      status: createdUser.status
    };

    // Generate production JWT token
    const token = jwt.sign(
      user,
      process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error details:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  const { email, password, tenantId: bodyTenantId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const targetTenantId = bodyTenantId || req.tenantId;

    // Scan database globally by email to support multi-tenant accounts
    const dbUsers = await prisma.user.findMany({
      where: { email }
    });

    if (dbUsers.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Verify passwords and find the best match
    let matchedUser = null;
    for (const user of dbUsers) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        // If a specific tenant context was requested, prefer it
        if (targetTenantId && user.tenant_id === targetTenantId) {
          matchedUser = user;
          break;
        }
        if (!matchedUser) {
          matchedUser = user;
        }
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Fetch tenant details if tenant_id is present
    let org = null;
    if (matchedUser.tenant_id) {
      org = await prisma.tenant.findUnique({
        where: { id: matchedUser.tenant_id }
      });
    }

    // Workspace status check for non-superadmins (suspended workspaces are blocked)
    const userRole = (matchedUser.role || '').toUpperCase();
    if (userRole !== 'SUPERADMIN' && org && org.status === 'SUSPENDED') {
      return res.status(403).json({
        message: 'Forbidden. This workspace has been suspended by the administrator.'
      });
    }


    const tenantName = org ? org.name : 'System Admin';

    // Prepare JWT Payload containing { userId, role, tenantId } along with standard user details
    const payload = {
      userId: matchedUser.id,
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      domain: matchedUser.domain,
      tenantId: matchedUser.tenant_id,
      tenant_id: matchedUser.tenant_id,
      tenant_name: tenantName,
      status: matchedUser.is_active ? 'ACTIVE' : 'INACTIVE'
    };

    // Generate production JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error details:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getStatus = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized. User context missing.' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ status: dbUser.status });
  } catch (error) {
    console.error('Get status error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


/**
 * POST /auth/forgot-password
 * Generates a secure reset token, stores it on the user, and emails a reset link.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    // Find any user with this email (any tenant)
    const user = await prisma.user.findFirst({ where: { email } });

    // Always respond 200 to avoid leaking which emails are registered
    if (!user) {
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate a secure 32-byte random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token: rawToken, reset_token_expiry: expiry }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your InternHub Password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#2563EB">Reset Your Password</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>We received a request to reset the password for your InternHub account.</p>
          <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563EB;color:white;border-radius:8px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#6b7280;font-size:12px">InternHub · nextern.io</p>
        </div>
      `
    });

    return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * POST /auth/reset-password
 * Validates the token and sets a new password.
 */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null
      }
    });

    return res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  register,
  login,
  getStatus,
  forgotPassword,
  resetPassword
};
