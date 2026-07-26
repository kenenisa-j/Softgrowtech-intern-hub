// apps/api-server/controllers/evaluationController.js
// Handles mentor evaluations of interns across multiple skill parameters.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');

/**
 * Submit an Intern Evaluation (Mentors only)
 */
const submitEvaluation = async (req, res, next) => {
  try {
    const mentorId = req.user.id;
    const tenantId = req.tenantId;
    const { internId, type, technicalSkills, communication, teamwork, problemSolving, attendance, professionalism, comments } = req.body;

    if (!['MENTOR', 'ORG_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only mentors or company administrators can submit evaluations.' });
    }

    if (!internId || !type) {
      return res.status(400).json({ message: 'internId and evaluation type (WEEKLY/MONTHLY/FINAL) are required.' });
    }

    // Check if the intern exists and belongs to the tenant
    const intern = await prisma.user.findFirst({
      where: { id: internId, tenant_id: tenantId, role: 'INTERN' }
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found within your organization.' });
    }

    // Parse scores (scale 1-10)
    const tech = parseInt(technicalSkills) || 0;
    const comm = parseInt(communication) || 0;
    const team = parseInt(teamwork) || 0;
    const prob = parseInt(problemSolving) || 0;
    const att = parseInt(attendance) || 0;
    const prof = parseInt(professionalism) || 0;

    // Calculate overall average score
    const overallScore = (tech + comm + team + prob + att + prof) / 6;

    // Save evaluation record
    const evaluation = await prisma.evaluation.create({
      data: {
        tenant_id: tenantId,
        intern_id: internId,
        mentor_id: mentorId,
        type: type.toUpperCase(),
        technical_skills: tech,
        communication: comm,
        teamwork: team,
        problem_solving: prob,
        attendance: att,
        professionalism: prof,
        overall_score: overallScore,
        comments: comments || null
      }
    });

    // Create notification for the intern
    await prisma.notification.create({
      data: {
        tenant_id: tenantId,
        user_id: internId,
        type: 'EVALUATION_SUBMITTED',
        content: `Your mentor has submitted a new ${type.toLowerCase()} evaluation. Overall Score: ${overallScore.toFixed(2)}.`
      }
    });

    logger.info({ msg: 'Intern evaluation submitted', evaluationId: evaluation.id, internId, mentorId, overallScore });

    return res.status(201).json({
      message: 'Evaluation submitted successfully.',
      evaluation
    });
  } catch (error) {
    logger.error('Error submitting evaluation', { error: error.message });
    next(error);
  }
};

/**
 * Retrieve Scoped Evaluations
 */
const getEvaluations = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const tenantId = req.tenantId;

    let whereClause = { tenant_id: tenantId };

    if (role === 'INTERN') {
      whereClause.intern_id = userId;
    } else if (role === 'MENTOR') {
      whereClause.mentor_id = userId;
    }

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        intern: {
          select: {
            id: true,
            name: true,
            email: true,
            domain: true
          }
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return res.json({ evaluations });
  } catch (error) {
    logger.error('Error fetching evaluations', { error: error.message });
    next(error);
  }
};

module.exports = {
  submitEvaluation,
  getEvaluations
};
