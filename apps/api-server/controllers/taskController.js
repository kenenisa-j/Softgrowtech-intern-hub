// apps/api-server/controllers/taskController.js
// Handles task assignment creation, retrieval, updates, and deletion for mentors and admins.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const { sendEmail } = require('../src/utils/email');


/**
 * Create a new task (Mentors & Admins only)
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, deadline, priority, attachmentPath, resources, points, domain } = req.body;
    const tenantId = req.tenantId;
    const createdBy = req.user.id;

    if (!['MENTOR', 'ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only mentors or company administrators can assign tasks.' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    // Default task domain matches the creator's domain track, or defaults to "Full-Stack"
    const taskDomain = domain || req.user.domain || 'Full-Stack';

    const task = await prisma.task.create({
      data: {
        tenant_id: tenantId,
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        domain: taskDomain,
        created_by: createdBy,
        priority: priority || 'MEDIUM',
        attachment_path: attachmentPath || null,
        resources: resources || null,
        points: points ? parseInt(points) : 100
      }
    });

    // Notify all interns in this domain track
    const interns = await prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        role: 'INTERN',
        domain: taskDomain
      }
    });

    for (const intern of interns) {
      await prisma.notification.create({
        data: {
          tenant_id: tenantId,
          user_id: intern.id,
          type: 'TASK_ASSIGNED',
          content: `A new task "${title}" has been assigned in the ${taskDomain} track.`
        }
      });

      // Send email notification to each intern
      try {
        await sendEmail({
          to: intern.email,
          subject: `New Task Assigned: ${title}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#2563EB">New Task Assigned</h2>
              <p>Hello ${intern.name || 'there'},</p>
              <p>A new task has been assigned in your <strong>${taskDomain}</strong> track:</p>
              <div style="padding:16px;background:#f3f4f6;border-radius:8px;margin:16px 0">
                <strong style="font-size:16px;color:#111827">${title}</strong>
                <p style="margin:8px 0 0;font-size:14px;color:#4b5563">${description || 'No description provided.'}</p>
                ${deadline ? `<p style="margin:8px 0 0;font-size:12px;color:#ef4444"><strong>Due Date:</strong> ${new Date(deadline).toLocaleString()}</p>` : ''}
              </div>
              <p>Please log in to your dashboard to submit your work before the deadline.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
              <p style="color:#6b7280;font-size:12px">InternHub · nextern.io</p>
            </div>
          `
        });
      } catch (err) {
        logger.error(`Failed to send task assignment email to ${intern.email}`, { error: err.message });
      }
    }

    logger.info({ msg: 'Task created successfully', taskId: task.id, tenantId, domain: taskDomain });

    return res.status(201).json({
      message: 'Task created successfully.',
      task
    });
  } catch (error) {
    logger.error('Error creating task', { error: error.message });
    next(error);
  }
};

/**
 * Get all tasks scoped by role and domain
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { id: userId, role, domain } = req.user;
    const tenantId = req.tenantId;

    let whereClause = { tenant_id: tenantId };

    // Interns only see tasks in their matching domain track
    if (role === 'INTERN') {
      whereClause.domain = domain;
    } else if (role === 'MENTOR') {
      // Mentors view tasks they created or tasks in their domain
      whereClause.domain = domain;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        submissions: {
          where: role === 'INTERN' ? { intern_id: userId } : undefined,
          select: {
            id: true,
            status: true,
            grade: true,
            score: true,
            submitted_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ tasks });
  } catch (error) {
    logger.error('Error fetching tasks', { error: error.message });
    next(error);
  }
};

/**
 * Edit an existing task
 */
const editTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, priority, attachmentPath, resources, points } = req.body;
    const tenantId = req.tenantId;

    if (!['MENTOR', 'ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only mentors or company administrators can edit tasks.' });
    }

    const task = await prisma.task.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        deadline: deadline ? new Date(deadline) : task.deadline,
        priority: priority || task.priority,
        attachment_path: attachmentPath !== undefined ? attachmentPath : task.attachment_path,
        resources: resources !== undefined ? resources : task.resources,
        points: points ? parseInt(points) : task.points
      }
    });

    logger.info({ msg: 'Task updated successfully', taskId: id, tenantId });

    return res.json({
      message: 'Task updated successfully.',
      task: updatedTask
    });
  } catch (error) {
    logger.error('Error editing task', { error: error.message });
    next(error);
  }
};

/**
 * Delete a task
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!['MENTOR', 'ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only mentors or company administrators can delete tasks.' });
    }

    const task = await prisma.task.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await prisma.task.delete({
      where: { id }
    });

    logger.info({ msg: 'Task deleted successfully', taskId: id, tenantId });

    return res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    logger.error('Error deleting task', { error: error.message });
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  editTask,
  deleteTask
};
