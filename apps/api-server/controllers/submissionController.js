// apps/api-server/controllers/submissionController.js
// Handles task submissions by interns and grading evaluations by mentors.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const { sendEmail } = require('../src/utils/email');


/**
 * Submit task or update existing submission before deadline (Interns only)
 */
const submitTask = async (req, res, next) => {
  try {
    const { task_id, submission_text, file_path, github_link } = req.body;
    const internId = req.user.id;
    const tenantId = req.tenantId;

    if (req.user.role !== 'INTERN') {
      return res.status(403).json({ message: 'Only interns can submit tasks.' });
    }

    if (!task_id) {
      return res.status(400).json({ message: 'Task ID is required.' });
    }

    // Verify task exists in this tenant
    const task = await prisma.task.findFirst({
      where: { id: task_id, tenant_id: tenantId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check if the task deadline has passed
    if (task.deadline && new Date() > new Date(task.deadline)) {
      return res.status(400).json({ message: 'The task deadline has passed. Submissions are closed.' });
    }

    // Check if a submission already exists for this task
    const existingSubmission = await prisma.submission.findFirst({
      where: { task_id, intern_id: internId }
    });

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          submission_text: submission_text || null,
          file_path: file_path || null,
          github_link: github_link || null,
          submitted_at: new Date()
        }
      });

      logger.info({ msg: 'Submission updated by intern', submissionId: updatedSubmission.id, taskId: task_id, internId });

      return res.json({
        message: 'Submission updated successfully.',
        submission: updatedSubmission
      });
    }

    // Create a new task submission
    const submission = await prisma.submission.create({
      data: {
        task_id,
        intern_id: internId,
        submission_text: submission_text || null,
        file_path: file_path || null,
        github_link: github_link || null,
        status: 'pending'
      }
    });

    // Notify mentors of this domain track
    const mentors = await prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        role: 'MENTOR',
        domain: task.domain
      }
    });

    for (const mentor of mentors) {
      await prisma.notification.create({
        data: {
          tenant_id: tenantId,
          user_id: mentor.id,
          type: 'SUBMISSION_RECEIVED',
          content: `${req.user.name} has submitted the task "${task.title}".`
        }
      });
    }

    logger.info({ msg: 'New task submission created', submissionId: submission.id, taskId: task_id, internId });

    return res.status(201).json({
      message: 'Submission created successfully.',
      submission
    });
  } catch (error) {
    logger.error('Error submitting task', { error: error.message });
    next(error);
  }
};

/**
 * Retrieve submissions (scoped by user role)
 */
const getSubmissions = async (req, res, next) => {
  try {
    const { id: userId, role, domain } = req.user;
    const tenantId = req.tenantId;

    let submissions = [];

    if (role === 'MENTOR') {
      // Mentors view submissions for interns in their domain track
      submissions = await prisma.submission.findMany({
        where: {
          task: {
            tenant_id: tenantId,
            domain: domain
          }
        },
        include: {
          task: {
            select: { title: true, points: true, domain: true }
          },
          // To fetch intern details, we join with User
          // Wait, Prisma model has task relationship but let's check if intern_id is linked to User.
          // In schema, Submission only has task_id relation, intern_id is a plain field.
          // Since intern_id is a plain String @db.VarChar(36), we can query the user manually or fetch it.
          // Let's query users under this tenant to map names or fetch them.
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      // Map names manually to prevent DB schema relation mismatch
      const internIds = [...new Set(submissions.map(s => s.intern_id))];
      const users = await prisma.user.findMany({
        where: { id: { in: internIds } },
        select: { id: true, name: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.name]));

      submissions = submissions.map(s => ({
        ...s,
        intern_name: userMap.get(s.intern_id) || 'Unknown Intern',
        task_title: s.task.title
      }));

    } else if (role === 'ORG_ADMIN' || role === 'ADMIN') {
      // Admins view all submissions for the tenant
      submissions = await prisma.submission.findMany({
        where: {
          task: {
            tenant_id: tenantId
          }
        },
        include: {
          task: {
            select: { title: true, points: true, domain: true }
          }
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      const internIds = [...new Set(submissions.map(s => s.intern_id))];
      const users = await prisma.user.findMany({
        where: { id: { in: internIds } },
        select: { id: true, name: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.name]));

      submissions = submissions.map(s => ({
        ...s,
        intern_name: userMap.get(s.intern_id) || 'Unknown Intern',
        task_title: s.task.title
      }));

    } else if (role === 'INTERN') {
      // Interns view only their own submissions
      submissions = await prisma.submission.findMany({
        where: {
          intern_id: userId
        },
        include: {
          task: {
            select: { title: true, points: true }
          }
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      submissions = submissions.map(s => ({
        ...s,
        task_title: s.task.title
      }));
    }

    return res.json({ submissions });
  } catch (error) {
    logger.error('Error fetching submissions', { error: error.message });
    next(error);
  }
};

/**
 * Grade task submission (Mentors only)
 */
const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, grade, score, feedback } = req.body;
    const tenantId = req.tenantId;

    if (!['MENTOR', 'ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only mentors or company administrators can grade submissions.' });
    }

    if (!status || !grade) {
      return res.status(400).json({ message: 'Status and grade are required.' });
    }

    const validStatuses = ['approved', 'needs_revision'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "needs_revision".' });
    }

    // Verify submission exists
    const submission = await prisma.submission.findFirst({
      where: { id },
      include: {
        task: true
      }
    });

    if (!submission || submission.task.tenant_id !== tenantId) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    // Update submission record
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        grade,
        score: score ? parseInt(score) : null,
        feedback: feedback || null,
        graded_at: new Date()
      }
    });

    // Notify the intern
    await prisma.notification.create({
      data: {
        tenant_id: tenantId,
        user_id: submission.intern_id,
        type: 'SUBMISSION_GRADED',
        content: `Your submission for task "${submission.task.title}" has been graded: ${status.toUpperCase()} (Grade: ${grade}).`
      }
    });

    // Send email notification to the intern
    try {
      const intern = await prisma.user.findUnique({
        where: { id: submission.intern_id }
      });
      if (intern) {
        await sendEmail({
          to: intern.email,
          subject: `Task Submission Graded: ${submission.task.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#2563EB">Task Submission Graded</h2>
              <p>Hello ${intern.name || 'there'},</p>
              <p>Your submission for the task <strong>${submission.task.title}</strong> has been reviewed and graded.</p>
              <div style="padding:16px;background:#f3f4f6;border-radius:8px;margin:16px 0">
                <p style="margin:0 0 8px;font-size:14px"><strong>Status:</strong> <span style="text-transform:uppercase;font-weight:bold;color:${status === 'approved' ? '#10B981' : '#EF4444'}">${status}</span></p>
                <p style="margin:0 0 8px;font-size:14px"><strong>Grade:</strong> ${grade}</p>
                ${score ? `<p style="margin:0 0 8px;font-size:14px"><strong>Score:</strong> ${score} / ${submission.task.points || 100}</p>` : ''}
                ${feedback ? `<p style="margin:8px 0 0;font-size:13px;color:#4b5563;border-left:2px solid #e5e7eb;padding-left:8px;font-style:italic">"${feedback}"</p>` : ''}
              </div>
              <p>Please log in to your dashboard to review details.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
              <p style="color:#6b7280;font-size:12px">InternHub · nextern.io</p>
            </div>
          `
        });
      }
    } catch (err) {
      logger.error(`Failed to send grading email notification to intern ${submission.intern_id}`, { error: err.message });
    }

    logger.info({ msg: 'Submission graded successfully', submissionId: id, status, grade, tenantId });

    return res.json({
      message: 'Submission graded successfully.',
      submission: updatedSubmission
    });
  } catch (error) {
    logger.error('Error grading submission', { error: error.message });
    next(error);
  }
};

module.exports = {
  submitTask,
  getSubmissions,
  gradeSubmission
};
