const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
  const { name, email, password, role, domain } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
  }

  const userDomain = domain || 'Full-Stack';
  const roleLower = role.toLowerCase();

  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into the users table
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, domain) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, roleLower, userDomain]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role: roleLower,
      domain: userDomain
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
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify password against stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domain: user.domain
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
