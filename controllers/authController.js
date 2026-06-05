const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper db imports
let db;
try {
  db = require('../config/db');
} catch (e) {
  console.warn('Could not load db config, using hardcoded fallback:', e.message);
}

const register = async (req, res) => {
  const { name, email, password, role, domain } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
  }

  const validDomains = ['Web Development', 'Data Science', 'Machine Learning', 'Full-Stack'];
  const userDomain = domain || 'Full-Stack';
  const roleLower = role.toLowerCase();

  const mockUser = {
    id: Math.floor(Math.random() * 1000) + 10,
    name,
    email,
    role: roleLower,
    domain: userDomain
  };

  const token = jwt.sign(
    mockUser,
    process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef',
    { expiresIn: '24h' }
  );

  try {
    if (db && typeof db.query === 'function') {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role, domain) VALUES (?, ?, ?, ?, ?)',
        [name, email, 'mocked_hash', roleLower, userDomain]
      ).catch(err => console.log('Database insert skipped/failed in registration:', err.message));
    }
  } catch (err) {
    console.log('Database bypass during registration:', err.message);
  }

  return res.status(201).json({
    message: 'User registered successfully (Demo Mode).',
    token,
    user: mockUser
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const emailLower = email.toLowerCase();
  let role = 'intern';
  if (emailLower.includes('mentor')) {
    role = 'mentor';
  } else if (emailLower.includes('admin')) {
    role = 'admin';
  }

  let domain = 'Web Development';
  if (emailLower.includes('data') || emailLower.includes('ds')) {
    domain = 'Data Science';
  } else if (emailLower.includes('ml') || emailLower.includes('machine')) {
    domain = 'Machine Learning';
  } else if (emailLower.includes('full') || emailLower.includes('fs') || emailLower.includes('stack')) {
    domain = 'Full-Stack';
  }

  const mockUser = {
    id: Math.floor(Math.random() * 1000) + 10,
    name: email.split('@')[0],
    email: email,
    role: role,
    domain: domain
  };

  const token = jwt.sign(
    mockUser,
    process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef',
    { expiresIn: '24h' }
  );

  try {
    if (db && typeof db.query === 'function') {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role, domain) VALUES (?, ?, ?, ?, ?)',
        [mockUser.name, mockUser.email, 'mocked_hash', mockUser.role, mockUser.domain]
      ).catch(() => {});
    }
  } catch (err) {
    // Ignore
  }

  const responseData = {
    message: 'Login successful (Demo Mode).',
    token,
    user: mockUser
  };

  if (role === 'intern' && domain === 'Web Development') {
    responseData.tasks = [
      {
        id: 101,
        title: 'HTML5 & Semantic CSS Layout',
        description: 'Build a responsive semantic HTML5 layout using CSS grid and flexbox.',
        deadline: '2026-06-15',
        domain: 'Web Development'
      },
      {
        id: 102,
        title: 'Javascript ES6+ Concepts API Integration',
        description: 'Implement fetching data from a public REST API using async/await and handling pagination.',
        deadline: '2026-06-20',
        domain: 'Web Development'
      },
      {
        id: 103,
        title: 'React Hooks and State Management',
        description: 'Create a state-managed React component using useReducer and useContext for advanced interactions.',
        deadline: '2026-06-25',
        domain: 'Web Development'
      }
    ];
  }

  if (role === 'mentor') {
    responseData.dashboardView = {
      registeredInternsCount: 3,
      approvalSuccessRate: 33,
      pendingAuditsCount: 1,
      submissions: [
        {
          id: 501,
          task_id: 101,
          intern_id: 10,
          intern_name: 'Alex Johnson',
          task_title: 'HTML5 & Semantic CSS Layout',
          submission_text: 'I completed the semantic layout assignment. Used grid and flexbox.',
          file_path: 'https://example.com/layout-submission.zip',
          github_link: 'https://github.com/alexj/html5-layout',
          status: 'pending',
          grade: null,
          feedback: null,
          submitted_at: '2026-06-04T12:00:00Z'
        },
        {
          id: 502,
          task_id: 102,
          intern_id: 11,
          intern_name: 'Emily Davis',
          task_title: 'Javascript ES6+ Concepts API Integration',
          submission_text: 'Used async await and custom pagination as requested.',
          file_path: 'https://example.com/api-submission.zip',
          github_link: 'https://github.com/emilyd/es6-api',
          status: 'approved',
          grade: 'A',
          feedback: 'Excellent work and clean code.',
          submitted_at: '2026-06-03T15:30:00Z'
        },
        {
          id: 503,
          task_id: 103,
          intern_id: 12,
          intern_name: 'Michael Smith',
          task_title: 'React Hooks and State Management',
          submission_text: 'Implemented using useReducer and useContext. Please review.',
          file_path: 'https://example.com/react-hooks.zip',
          github_link: 'https://github.com/mikes/react-state',
          status: 'needs_revision',
          grade: 'C',
          feedback: 'Please fix the infinite rerender in useEffect.',
          submitted_at: '2026-06-02T09:15:00Z'
        }
      ]
    };
  }

  return res.json(responseData);
};

module.exports = {
  register,
  login
};
