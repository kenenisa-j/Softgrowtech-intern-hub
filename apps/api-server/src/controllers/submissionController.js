// src/controllers/submissionController.js
// Handles task submissions from interns and grading from mentors/admins using Prisma ORM and BullMQ.

const prisma = require('../prisma/client');
const logger = require('../utils/logger');
const { aiReviewQueue, pdfGenerationQueue } = require('../config/redisQueue');

/**
 * Submit work for an assigned task.
 * Expected req.body: { task_id, submission_text, file_path, github_link }
 */
async function submitTask(req, res) {
  try {
    const { task_id, submission_text, file_path, github_link } = req.body;
    const internId = req.user.id;
    const tenantId = req.tenantId || req.headers['x-tenant-id'];

    if (!task_id) {
      return res.status(400).json({ message: 'Task ID is required for submission.' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant identifier is required.' });
    }

    // Verify task exists under this tenant context
    const task = await prisma.task.findFirst({
      where: {
        id: task_id,
        tenant_id: tenantId,
      },
    });

    if (!task) {
      logger.warn('Task submission rejected: Task not found or tenant mismatch', { task_id, tenantId });
      return res.status(404).json({ message: 'Task not found under the active tenant context.' });
    }

    // Create submission in database using Prisma Client
    const submission = await prisma.submission.create({
      data: {
        task_id,
        intern_id: internId,
        submission_text: submission_text || null,
        file_path: file_path || null,
        github_link: github_link || null,
        status: 'pending',
      },
    });

    logger.info('Task submission created successfully', { submissionId: submission.id, internId, tenantId });

    // Enqueue a background AI code review job
    try {
      await aiReviewQueue.add('aiReview', {
        submissionId: submission.id,
        tenantId,
        assignmentCode: task.title,
        criteria: task.description || 'General evaluation criteria',
      });
      logger.info('AI code review job enqueued successfully', { submissionId: submission.id });
    } catch (queueErr) {
      logger.error('Failed to enqueue AI review background job', { error: queueErr.message, submissionId: submission.id });
    }

    return res.status(201).json({
      message: 'Submission created successfully.',
      submissionId: submission.id,
      submission,
    });
  } catch (error) {
    logger.error('Error in submitTask controller', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

/**
 * Fetch submissions according to user role and tenant context.
 */
async function getSubmissions(req, res) {
  try {
    const { role, id: userId, domain } = req.user;
    const tenantId = req.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant identifier is required.' });
    }

    let submissionsList;

    if (role === 'mentor' || role === 'admin') {
      if (role === 'mentor') {
        submissionsList = await prisma.submission.findMany({
          where: {
            task: {
              tenant_id: tenantId,
              domain: domain,
            },
          },
          include: {
            task: true,
          },
        });
      } else {
        submissionsList = await prisma.submission.findMany({
          where: {
            task: {
              tenant_id: tenantId,
            },
          },
          include: {
            task: true,
          },
        });
      }

      // Fetch user details for each submission to map intern_name
      const internIds = [...new Set(submissionsList.map((s) => s.intern_id))];
      const users = await prisma.user.findMany({
        where: { id: { in: internIds } },
        select: { id: true, name: true, email: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u.name || u.email]));

      const formatted = submissionsList.map((s) => ({
        ...s,
        intern_name: userMap.get(s.intern_id) || 'Unknown Intern',
        task_title: s.task.title,
      }));

      return res.json({ submissions: formatted });
    } else if (role === 'intern') {
      submissionsList = await prisma.submission.findMany({
        where: {
          intern_id: userId,
          task: {
            tenant_id: tenantId,
          },
        },
        include: {
          task: true,
        },
      });

      const formatted = submissionsList.map((s) => ({
        ...s,
        task_title: s.task.title,
      }));

      return res.json({ submissions: formatted });
    } else {
      return res.status(403).json({ message: 'Access denied. Unknown role.' });
    }
  } catch (error) {
    logger.error('Error in getSubmissions controller', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

/**
 * Grade/Evaluate a submission and trigger automated certificates if approved.
 * Expected req.body: { status, grade, feedback, score }
 */
async function gradeSubmission(req, res) {
  try {
    const { id } = req.params;
    const { status, grade, feedback, score } = req.body;
    const tenantId = req.tenantId || req.headers['x-tenant-id'];

    if (!status || !grade) {
      return res.status(400).json({ message: 'Status and grade are required for grading.' });
    }

    const validStatuses = ['approved', 'needs_revision'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "needs_revision".' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant identifier is required.' });
    }

    // Verify submission exists and belongs to this tenant
    const submission = await prisma.submission.findFirst({
      where: {
        id: id,
        task: {
          tenant_id: tenantId,
        },
      },
      include: {
        task: true,
      },
    });

    if (!submission) {
      logger.warn('Submission grading rejected: Submission not found or tenant mismatch', { id, tenantId });
      return res.status(404).json({ message: 'Submission not found.' });
    }

    // Update submission
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status,
        grade,
        feedback: feedback || null,
        score: score !== undefined ? parseInt(score, 10) : null,
        graded_at: new Date(),
      },
    });

    logger.info('Submission graded successfully', { submissionId: id, status, grade });

    // If approved, trigger certificate background generation job
    if (status === 'approved') {
      try {
        await pdfGenerationQueue.add('generateCertificate', {
          userId: submission.intern_id,
          internId: submission.intern_id,
          trackName: submission.task.title,
          tenantId,
        });
        logger.info('Certificate generation job enqueued', { internId: submission.intern_id });
      } catch (queueErr) {
        logger.error('Failed to enqueue certificate generation background job', { error: queueErr.message, internId: submission.intern_id });
      }
    }

    return res.json({
      message: 'Submission graded successfully.',
      submissionId: id,
      submission: updated,
      gradedDetails: {
        status,
        grade,
        feedback,
      },
    });
  } catch (error) {
    logger.error('Error in gradeSubmission controller', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = {
  submitTask,
  createSubmission: submitTask, // alias
  getSubmissions,
  gradeSubmission,
  evaluateSubmission: gradeSubmission, // alias
};
