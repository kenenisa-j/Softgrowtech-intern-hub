// src/controllers/assessmentController.js
// Handles submission of assessment attempts and scoring logic.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Submit an assessment attempt.
 * Expected body:
 * {
 *   assessmentId: string,
 *   optionIds: string[]   // array of selected AnswerOption IDs
 * }
 */
async function submitAssessmentAttempt(req, res) {
  try {
    const { assessmentId, optionIds } = req.body;
    const tenantId = req.tenantId; // set by tenantResolver middleware

    if (!assessmentId || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ error: 'assessmentId and optionIds are required.' });
    }

    // Load assessment with its questions, point values and correct options
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          select: {
            id: true,
            point_value: true,
            answerOptions: {
              select: { id: true, is_correct: true }
            }
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // Map correct option IDs per question
    const correctMap = new Map(); // questionId -> Set(correctOptionId)
    for (const q of assessment.questions) {
      const correctIds = q.answerOptions.filter(o => o.is_correct).map(o => o.id);
      correctMap.set(q.id, new Set(correctIds));
    }

    // Fetch selected options to verify ownership of question
    const selectedOptions = await prisma.answerOption.findMany({
      where: { id: { in: optionIds } },
      select: { id: true, question_id: true, is_correct: true }
    });

    // Compute total score
    let totalScore = 0;
    for (const opt of selectedOptions) {
      const question = assessment.questions.find(q => q.id === opt.question_id);
      if (!question) continue; // safety
      if (opt.is_correct) {
        totalScore += question.point_value;
      }
    }

    // Determine pass/fail (default 70% threshold)
    const passThreshold = 0.7;
    const isPassed = totalScore >= Math.ceil(assessment.total_points * passThreshold);

    // Persist attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        user_id: req.user?.id || null,
        total_score: totalScore,
        is_passed: isPassed
      }
    });

    logger.info('Assessment attempt recorded', {
      attemptId: attempt.id,
      userId: req.user?.id,
      assessmentId,
      totalScore,
      isPassed
    });

    return res.status(201).json({
      message: 'Assessment submitted',
      attemptId: attempt.id,
      totalScore,
      isPassed
    });
  } catch (err) {
    logger.error('Error in submitAssessmentAttempt', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { submitAssessmentAttempt };
