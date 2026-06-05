const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const register = async (req, res) => {
  const { name, email, password, role, domain } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
  }

  const validDomains = ['Web Development', 'Data Science', 'Machine Learning', 'Full-Stack'];
  const userDomain = domain || 'Full-Stack';
  if (!validDomains.includes(userDomain)) {
    return res.status(400).json({ message: 'Invalid domain track selection.' });
  }

  // Validate role
  const validRoles = ['intern', 'mentor', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be one of: intern, mentor, admin' });
  }

  try {
    // Check if email already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, domain) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, userDomain]
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: result.insertId,
        name,
        email,
        role,
        domain: userDomain
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Search user (our mock DB automatically returns/creates one, but we check/handle it here too)
    let [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      const role = email.includes('mentor') ? 'mentor' : (email.includes('admin') ? 'admin' : 'intern');
      let domain = 'Web Development';
      if (email.includes('data') || email.includes('ds')) domain = 'Data Science';
      else if (email.includes('ml') || email.includes('machine')) domain = 'Machine Learning';
      else if (email.includes('full') || email.includes('fs')) domain = 'Full-Stack';

      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role, domain) VALUES (?, ?, ?, ?, ?)',
        [email.split('@')[0], email, 'mocked', role, domain]
      );
      
      const [newUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      user = newUsers[0];
    } else {
      user = users[0];
    }

    // Sign JWT (Bypass password check)
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      domain: user.domain
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful (Demo Mode).',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        domain: user.domain
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  register,
  login
};
