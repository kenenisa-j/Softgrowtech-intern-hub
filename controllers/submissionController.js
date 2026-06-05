const db = require('../config/db');

const submitTask = async (req, res) => {
  const { task_id, submission_text, file_path, github_link } = req.body;

  if (!task_id) {
    return res.status(400).json({ message: 'Task ID is required for submission.' });
  }

  try {
    const internId = req.user.id;

    // Verify task exists
    const [tasks] = await db.query('SELECT id FROM tasks WHERE id = ?', [task_id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const [result] = await db.query(
      'INSERT INTO submissions (task_id, intern_id, submission_text, file_path, github_link) VALUES (?, ?, ?, ?, ?)',
      [task_id, internId, submission_text || null, file_path || null, github_link || null]
    );

    return res.status(201).json({
      message: 'Submission created successfully.',
      submission: {
        id: result.insertId,
        task_id,
        intern_id: internId,
        submission_text,
        file_path,
        github_link,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Submit task error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getSubmissions = async (req, res) => {
  const { role, id: userId } = req.user;

  try {
    if (role === 'mentor' || role === 'admin') {
      const query = `
        SELECT s.*, u.name AS intern_name, t.title AS task_title
        FROM submissions s
        JOIN users u ON s.intern_id = u.id
        JOIN tasks t ON s.task_id = t.id
      `;
      const [submissions] = await db.query(query);
      return res.json({ submissions });
    } else if (role === 'intern') {
      const query = `
        SELECT s.*, t.title AS task_title
        FROM submissions s
        JOIN tasks t ON s.task_id = t.id
        WHERE s.intern_id = ?
      `;
      const [submissions] = await db.query(query, [userId]);
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
    const [submissions] = await db.query('SELECT id FROM submissions WHERE id = ?', [id]);
    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const query = `
      UPDATE submissions
      SET status = ?, grade = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.query(query, [status, grade, feedback || null, id]);

    return res.json({
      message: 'Submission graded successfully.',
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
