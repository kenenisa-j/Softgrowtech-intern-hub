// apps/api-server/routes/reviewRoutes.js
const express = require('express')
const router = express.Router()
const { createReview, getReviewsByProgram, getMyReviews } = require('../controllers/reviewController')
const { verifyToken, requireRole } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.post('/', requireRole(['INTERN', 'STUDENT']), createReview)
router.get('/my', getMyReviews)
router.get('/program/:programId', requireRole(['ORG_ADMIN', 'ADMIN']), getReviewsByProgram)

module.exports = router
