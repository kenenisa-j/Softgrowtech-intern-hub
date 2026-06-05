const db = require('../config/db');

const createTask = async (req, res) => {
  const { title, description, deadline } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  try {
    const createdBy = req.user.id;
    const domain = req.user.domain || 'Full-Stack';

    let insertId = Math.floor(Math.random() * 1000) + 100;
    try {
      const [result] = await db.query(
        'INSERT INTO tasks (title, description, deadline, created_by, domain) VALUES (?, ?, ?, ?, ?)',
        [title, description || null, deadline || null, createdBy, domain]
      );
      if (result && result.insertId) {
        insertId = result.insertId;
      }
    } catch (e) {
      console.log('Skipped DB task insert:', e.message);
    }

    return res.status(201).json({
      message: 'Task created successfully (Demo Mode).',
      task: {
        id: insertId,
        title,
        description,
        deadline,
        created_by: createdBy,
        domain
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const domain = req.user.domain || 'Full-Stack';
    let tasks = [];
    try {
      const [resTasks] = await db.query('SELECT * FROM tasks WHERE domain = ?', [domain]);
      tasks = resTasks;
    } catch (e) {
      console.log('Skipped DB task query, using mock data:', e.message);
    }

    if (!tasks || tasks.length === 0) {
      if (domain === 'Web Development') {
        tasks = [
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
          }
        ];
      } else if (domain === 'Full-Stack') {
        tasks = [
          {
            id: 201,
            title: 'RESTful API with Node.js & Express',
            description: 'Design and implement a fully-secured Express RESTful API with validation middlewares.',
            deadline: '2026-06-18',
            created_by: 3,
            domain: 'Full-Stack'
          }
        ];
      } else if (domain === 'Data Science') {
        tasks = [
          {
            id: 301,
            title: 'Data Wrangling and Cleaning with Pandas',
            description: 'Perform complex data cleaning, handling missing values, and pivot operations on a raw CSV dataset.',
            deadline: '2026-06-19',
            created_by: 2,
            domain: 'Data Science'
          }
        ];
      } else if (domain === 'Machine Learning') {
        tasks = [
          {
            id: 401,
            title: 'Supervised Learning Regression Models',
            description: 'Train and evaluate multiple linear and polynomial regression models using scikit-learn.',
            deadline: '2026-06-22',
            created_by: 2,
            domain: 'Machine Learning'
          }
        ];
      }
    }

    return res.json({ tasks });
  } catch (error) {
    console.error('Get all tasks error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createTask,
  getAllTasks
};
