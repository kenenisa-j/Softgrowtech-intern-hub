const db = require('../config/db');

const createTask = async (req, res) => {
  const { title, description, deadline } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  try {
    const createdBy = req.user.id;

    const [result] = await db.query(
      'INSERT INTO tasks (title, description, deadline, created_by) VALUES (?, ?, ?, ?)',
      [title, description || null, deadline || null, createdBy]
    );

    return res.status(201).json({
      message: 'Task created successfully.',
      task: {
        id: result.insertId,
        title,
        description,
        deadline,
        created_by: createdBy
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const [tasks] = await db.query('SELECT * FROM tasks');
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
