const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/prisma/client');

const register = async (req, res) => {
  const { name, email, password, role, domain } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
  }

  const userDomain = domain || 'Full-Stack';
  const roleLower = role.toLowerCase();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Get tenant ID from request (resolved by tenantResolver middleware)
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing.' });
    }

    // Insert user into the users table using Prisma
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: roleLower,
        domain: userDomain,
        tenant_id: tenantId
      }
    });

    const user = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      domain: createdUser.domain
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const dbUser = await prisma.user.findFirst({
      where: { email }
    });
    if (!dbUser) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Verify password against stored bcrypt hash
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const payload = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      domain: dbUser.domain
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

module.exports = {
  register,
  login
};
