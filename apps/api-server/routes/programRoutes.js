// apps/api-server/routes/programRoutes.js
const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const applicationGuard = require('../middleware/applicationGuard');

// Fully public (no token, no tenant context required)
router.get('/stats', programController.getPlatformStats);
router.get('/categories', programController.getCategories);
router.get('/featured', programController.getFeaturedPrograms);
router.get('/public', programController.getPublicPrograms);
router.get('/public/:id', programController.getPublicProgramDetails);
router.post('/apply', programController.submitApplication);

// Protected Routes
router.use(verifyToken);
router.use(applicationGuard);

// Program CRUD
router.post('/', requireRole(['ORG_ADMIN', 'ADMIN']), programController.createProgram);
router.put('/:id', requireRole(['ORG_ADMIN', 'ADMIN']), programController.editProgram);
router.delete('/:id', requireRole(['ORG_ADMIN', 'ADMIN']), programController.deleteProgram);
router.get('/tenant', programController.getTenantPrograms);
router.get('/my', programController.getTenantPrograms); // alias — CompanyDashboard uses /programs/my
router.get('/my-program', programController.getMyInternProgram); // Intern dashboard

// Mentor M:M assignment
router.get('/:id/mentors', programController.getProgramMentors);
router.post('/:id/mentors', requireRole(['ORG_ADMIN', 'ADMIN']), programController.addMentorToProgram);
router.delete('/:id/mentors/:mentorId', requireRole(['ORG_ADMIN', 'ADMIN']), programController.removeMentorFromProgram);

// Application Pipeline
router.get('/applications', requireRole(['ORG_ADMIN', 'ADMIN', 'MENTOR']), programController.getApplications);
router.get('/org', requireRole(['ORG_ADMIN', 'ADMIN', 'MENTOR']), programController.getApplications); // alias for /applications/org
router.put('/applications/:id/status', requireRole(['ORG_ADMIN', 'ADMIN']), programController.updateApplicationStatus);

module.exports = router;

