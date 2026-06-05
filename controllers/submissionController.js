const db = require('../config/db');

// In-memory array to track submissions added during live session if DB fails
const localSubmissions = [
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
    submitted_at: new Date()
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
    submitted_at: new Date()
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
    submitted_at: new Date()
  }
];

const submitTask = async (req, res) => {
  const { task_id, submission_text, file_path, github_link } = req.body;

  if (!task_id) {
    return res.status(400).json({ message: 'Task ID is required for submission.' });
  }

  try {
    const internId = req.user.id;
    const internName = req.user.name || 'Intern User';

    let insertId = Math.floor(Math.random() * 1000) + 500;
    try {
      const [result] = await db.query(
        'INSERT INTO submissions (task_id, intern_id, submission_text, file_path, github_link) VALUES (?, ?, ?, ?, ?)',
        [task_id, internId, submission_text || null, file_path || null, github_link || null]
      );
      if (result && result.insertId) {
        insertId = result.insertId;
      }
    } catch (e) {
      console.log('Skipped DB submission insert:', e.message);
    }

    const newSubmission = {
      id: insertId,
      task_id,
      intern_id: internId,
      intern_name: internName,
      task_title: 'Task ' + task_id,
      submission_text,
      file_path,
      github_link,
      status: 'pending',
      grade: null,
      feedback: null,
      submitted_at: new Date()
    };
    localSubmissions.push(newSubmission);

    return res.status(201).json({
      message: 'Submission created successfully (Demo Mode).',
      submission: newSubmission
    });
  } catch (error) {
    console.error('Submit task error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getSubmissions = async (req, res) => {
  const { role, id: userId, domain } = req.user;

  try {
    if (role === 'mentor' || role === 'admin') {
      let submissions = [];
      try {
        let query;
        let params = [];
        if (role === 'mentor') {
          query = `
            SELECT s.*, u.name AS intern_name, t.title AS task_title
            FROM submissions s
            JOIN users u ON s.intern_id = u.id
            JOIN tasks t ON s.task_id = t.id
            WHERE u.domain = ?
          `;
          params.push(domain);
        } else {
          query = `
            SELECT s.*, u.name AS intern_name, t.title AS task_title
            FROM submissions s
            JOIN users u ON s.intern_id = u.id
            JOIN tasks t ON s.task_id = t.id
          `;
        }
        const [resSubmissions] = await db.query(query, params);
        submissions = resSubmissions;
      } catch (e) {
        console.log('Skipped DB submissions fetch, using mock data:', e.message);
      }

      if (!submissions || submissions.length === 0) {
        submissions = localSubmissions;
      }
      return res.json({ submissions });
    } else if (role === 'intern') {
      let submissions = [];
      try {
        const query = `
          SELECT s.*, t.title AS task_title
          FROM submissions s
          JOIN tasks t ON s.task_id = t.id
          WHERE s.intern_id = ?
        `;
        const [resSubmissions] = await db.query(query, [userId]);
        submissions = resSubmissions;
      } catch (e) {
        console.log('Skipped DB submissions fetch for intern, using mock data:', e.message);
      }

      if (!submissions || submissions.length === 0) {
        submissions = localSubmissions.filter(s => s.intern_id === userId);
      }
      return res.json({ submissions });
    } else {
      return res.status(403).json({ message: 'Access denied. Unknown role.' });
    }
  } catch (error) {
    console.error('Get submissions error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const gradeSubmission = async (req, res) => {
  const { id } = req.params;
  const { status, grade, feedback } = req.body;

  if (!status || !grade) {
    return res.status(400).json({ message: 'Status and grade are required for grading.' });
  }

  const validStatuses = ['approved', 'needs_revision'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "approved" or "needs_revision".' });
  }

  try {
    try {
      const query = `
        UPDATE submissions
        SET status = ?, grade = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await db.query(query, [status, grade, feedback || null, id]);
    } catch (e) {
      console.log('Skipped DB grade update:', e.message);
    }

    const sub = localSubmissions.find(s => s.id == id);
    if (sub) {
      sub.status = status;
      sub.grade = grade;
      sub.feedback = feedback;
      sub.graded_at = new Date();
    }

    return res.json({
      message: 'Submission graded successfully (Demo Mode).',
      submissionId: id,
      gradedDetails: {
        status,
        grade,
        feedback
      }
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  submitTask,
  getSubmissions,
  gradeSubmission
};
