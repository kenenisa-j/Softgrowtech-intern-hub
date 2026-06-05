const bcrypt = require('bcryptjs');

// Helper to hash passwords for mock users
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync('password', salt);

const users = [
  {
    id: 1,
    name: 'Intern User',
    email: 'intern@example.com',
    password_hash: passwordHash,
    role: 'intern',
    domain: 'Web Development'
  },
  {
    id: 2,
    name: 'Mentor User',
    email: 'mentor@example.com',
    password_hash: passwordHash,
    role: 'mentor',
    domain: 'Web Development'
  },
  {
    id: 3,
    name: 'Admin User',
    email: 'admin@example.com',
    password_hash: passwordHash,
    role: 'admin',
    domain: 'Full-Stack'
  }
];

const tasks = [
  // Web Development
  {
    id: 101,
    title: 'HTML5 & Semantic CSS Layout',
    description: 'Build a responsive semantic HTML5 layout using CSS grid and flexbox.',
    deadline: '2026-06-15',
    created_by: 2,
    domain: 'Web Development'
  },
  {
    id: 102,
    title: 'Javascript ES6+ Concepts API Integration',
    description: 'Implement fetching data from a public REST API using async/await and handling pagination.',
    deadline: '2026-06-20',
    created_by: 2,
    domain: 'Web Development'
  },
  {
    id: 103,
    title: 'React Hooks and State Management',
    description: 'Create a state-managed React component using useReducer and useContext for advanced interactions.',
    deadline: '2026-06-25',
    created_by: 2,
    domain: 'Web Development'
  },
  // Full-Stack
  {
    id: 201,
    title: 'RESTful API with Node.js & Express',
    description: 'Design and implement a fully-secured Express RESTful API with validation middlewares.',
    deadline: '2026-06-18',
    created_by: 3,
    domain: 'Full-Stack'
  },
  // Data Science
  {
    id: 301,
    title: 'Data Wrangling and Cleaning with Pandas',
    description: 'Perform complex data cleaning, handling missing values, and pivot operations on a raw CSV dataset.',
    deadline: '2026-06-19',
    created_by: 2,
    domain: 'Data Science'
  },
  // Machine Learning
  {
    id: 401,
    title: 'Supervised Learning Regression Models',
    description: 'Train and evaluate multiple linear and polynomial regression models using scikit-learn.',
    deadline: '2026-06-22',
    created_by: 2,
    domain: 'Machine Learning'
  }
];

const submissions = [
  {
    id: 501,
    task_id: 101,
    intern_id: 1,
    submission_text: 'Hello, here is my link to my HTML CSS layout project.',
    file_path: 'https://example.com/submission1.pdf',
    github_link: 'https://github.com/intern/html-css-layout',
    status: 'approved',
    grade: 'A',
    feedback: 'Excellent clean markup and beautiful styling!',
    graded_at: new Date()
  }
];

const query = async (sql, params = []) => {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();

  // 1. SELECT * FROM users WHERE email = ?
  if (normalizedSql.includes('SELECT * FROM users WHERE email = ?')) {
    const email = params[0];
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // If not found, create a new mock user dynamically (bypass authentication!)
    if (!user) {
      const role = email.includes('mentor') ? 'mentor' : (email.includes('admin') ? 'admin' : 'intern');
      let domain = 'Web Development';
      if (email.includes('data') || email.includes('ds')) domain = 'Data Science';
      else if (email.includes('ml') || email.includes('machine')) domain = 'Machine Learning';
      else if (email.includes('full') || email.includes('fs')) domain = 'Full-Stack';

      user = {
        id: users.length + 1,
        name: email.split('@')[0],
        email: email,
        password_hash: passwordHash, // Match the password hash
        role: role,
        domain: domain
      };
      users.push(user);
    }
    return [ [user] ];
  }

  // 2. INSERT INTO users ...
  if (normalizedSql.includes('INSERT INTO users')) {
    // INSERT INTO users (name, email, password_hash, role, domain)
    const [name, email, password_hash, role, domain] = params;
    const user = {
      id: users.length + 1,
      name,
      email,
      password_hash,
      role,
      domain
    };
    users.push(user);
    return [{ insertId: user.id }];
  }

  // 3. SELECT * FROM tasks WHERE domain = ?
  if (normalizedSql.includes('SELECT * FROM tasks WHERE domain = ?')) {
    const domain = params[0];
    const filteredTasks = tasks.filter(t => t.domain === domain);
    return [filteredTasks];
  }

  // 4. INSERT INTO tasks
  if (normalizedSql.includes('INSERT INTO tasks')) {
    const [title, description, deadline, created_by, domain] = params;
    const task = {
      id: tasks.length + 100,
      title,
      description,
      deadline,
      created_by,
      domain
    };
    tasks.push(task);
    return [{ insertId: task.id }];
  }

  // 5. SELECT id FROM tasks WHERE id = ?
  if (normalizedSql.includes('SELECT id FROM tasks WHERE id = ?')) {
    const taskId = params[0];
    const task = tasks.find(t => t.id == taskId);
    return [task ? [task] : []];
  }

  // 6. INSERT INTO submissions
  if (normalizedSql.includes('INSERT INTO submissions')) {
    const [task_id, intern_id, submission_text, file_path, github_link] = params;
    const submission = {
      id: submissions.length + 500,
      task_id,
      intern_id,
      submission_text,
      file_path,
      github_link,
      status: 'pending',
      grade: null,
      feedback: null,
      graded_at: null
    };
    submissions.push(submission);
    return [{ insertId: submission.id }];
  }

  // 7. GET SUBMISSIONS for Mentor or Admin
  if (normalizedSql.includes('SELECT s.*, u.name AS intern_name, t.title AS task_title FROM submissions s JOIN users u ON s.intern_id = u.id JOIN tasks t ON s.task_id = t.id')) {
    // Check if domain is filtered
    if (normalizedSql.includes('WHERE u.domain = ?')) {
      const domain = params[0];
      const res = submissions
        .filter(s => {
          const u = users.find(usr => usr.id == s.intern_id);
          return u && u.domain === domain;
        })
        .map(s => {
          const u = users.find(usr => usr.id == s.intern_id);
          const t = tasks.find(tsk => tsk.id == s.task_id);
          return {
            ...s,
            intern_name: u ? u.name : 'Unknown Intern',
            task_title: t ? t.title : 'Unknown Task'
          };
        });
      return [res];
    } else {
      const res = submissions.map(s => {
        const u = users.find(usr => usr.id == s.intern_id);
        const t = tasks.find(tsk => tsk.id == s.task_id);
        return {
          ...s,
          intern_name: u ? u.name : 'Unknown Intern',
          task_title: t ? t.title : 'Unknown Task'
        };
      });
      return [res];
    }
  }

  // 8. GET SUBMISSIONS for Intern
  if (normalizedSql.includes('SELECT s.*, t.title AS task_title FROM submissions s JOIN tasks t ON s.task_id = t.id WHERE s.intern_id = ?')) {
    const internId = params[0];
    const res = submissions
      .filter(s => s.intern_id == internId)
      .map(s => {
        const t = tasks.find(tsk => tsk.id == s.task_id);
        return {
          ...s,
          task_title: t ? t.title : 'Unknown Task'
        };
      });
    return [res];
  }

  // 9. SELECT id FROM submissions WHERE id = ?
  if (normalizedSql.includes('SELECT id FROM submissions WHERE id = ?')) {
    const subId = params[0];
    const sub = submissions.find(s => s.id == subId);
    return [sub ? [sub] : []];
  }

  // 10. UPDATE submissions
  if (normalizedSql.includes('UPDATE submissions SET status = ?')) {
    const [status, grade, feedback, id] = params;
    const sub = submissions.find(s => s.id == id);
    if (sub) {
      sub.status = status;
      sub.grade = grade;
      sub.feedback = feedback;
      sub.graded_at = new Date();
    }
    return [{}];
  }

  // Default fallback (returns empty array to prevent failure)
  return [[]];
};

const getConnection = async () => {
  return {
    release: () => {},
    query: query
  };
};

console.log('Database connection pool established successfully (Demo / Hardcoded Mode).');

module.exports = {
  query,
  getConnection
};
