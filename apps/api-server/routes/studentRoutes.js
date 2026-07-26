// apps/api-server/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public — self-registration
router.post('/register', studentController.registerStudent);

// Protected — require token (student or any authenticated user)
router.use(verifyToken);
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/saved', studentController.getSavedInternships);
router.post('/saved/:programId', studentController.saveInternship);
router.delete('/saved/:programId', studentController.unsaveInternship);
router.get('/applications', studentController.getMyApplications);

module.exports = router;
