const prisma = require('../src/prisma/client');

const createTask = async (req, res) => {
  const { title, description, deadline } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  try {
    const createdBy = req.user.id;
    const domain = req.user.domain || 'Full-Stack';
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        created_by: createdBy,
        domain,
        tenant_id: tenantId
      }
    });

    return res.status(201).json({
      message: 'Task created successfully.',
      task
    });
  } catch (error) {
    console.error('Create task error details:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const domain = req.user.domain || 'Full-Stack';
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing.' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        domain,
        tenant_id: tenantId
      }
    });

    return res.json({ tasks });
  } catch (error) {
    console.error('Get all tasks error details:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createTask,
  getAllTasks
};
