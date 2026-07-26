// apps/api-server/controllers/reviewController.js

const prisma = require('../src/prisma/client')
const logger = require('../src/utils/logger')

/**
 * POST /reviews — Intern submits a review for their program
 */
const createReview = async (req, res) => {
  try {
    const { programId, rating, title, body } = req.body
    const userId = req.user.id
    const tenantId = req.tenantId

    if (!programId || !rating) {
      return res.status(400).json({ message: 'programId and rating are required.' })
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' })
    }

    // Only accepted interns who have a final evaluation can review
    const hasFinalEval = await prisma.evaluation.findFirst({
      where: { intern_id: userId, tenant_id: tenantId, type: 'FINAL' }
    })
    if (!hasFinalEval) {
      return res.status(403).json({ message: 'You can only review after receiving your final evaluation.' })
    }

    // Prevent duplicate reviews
    const existing = await prisma.review.findFirst({
      where: { reviewer_id: userId, receiver_id: programId }
    })
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this program.' })
    }

    // receiver_id used for program reviews (store programId in receiver_id field)
    const review = await prisma.review.create({
      data: {
        tenant_id: tenantId,
        reviewer_id: userId,
        receiver_id: programId,
        rating,
        comment: body ? `${title ? title + ': ' : ''}${body}` : title || ''
      }
    })

    return res.status(201).json({ message: 'Review submitted.', review })
  } catch (error) {
    logger.error('Error creating review', { error: error.message })
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

/**
 * GET /reviews/program/:programId — Org admin sees all reviews for a program
 */
const getReviewsByProgram = async (req, res) => {
  try {
    const { programId } = req.params
    const tenantId = req.tenantId

    const reviews = await prisma.review.findMany({
      where: { receiver_id: programId, tenant_id: tenantId },
      include: {
        reviewer: { select: { id: true, name: true, avatar_url: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const avg = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

    return res.json({ reviews, averageRating: avg, total: reviews.length })
  } catch (error) {
    logger.error('Error fetching reviews', { error: error.message })
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

/**
 * GET /reviews/my — Intern sees their own submitted reviews
 */
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id
    const reviews = await prisma.review.findMany({
      where: { reviewer_id: userId },
      orderBy: { created_at: 'desc' }
    })
    return res.json({ reviews })
  } catch (error) {
    logger.error('Error fetching own reviews', { error: error.message })
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

module.exports = { createReview, getReviewsByProgram, getMyReviews }
