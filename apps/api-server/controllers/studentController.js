// apps/api-server/controllers/studentController.js
// Handles global student self-registration, profile management, and saved internships.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Student self-registration (no tenant required — global account)
 * POST /api/v1/students/register
 */
const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, university, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Students have no tenant_id — global account
    const existing = await prisma.user.findFirst({
      where: { email, tenant_id: null }
    });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const student = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: 'STUDENT',
        domain: 'Student',
        tenant_id: null,
        university: university || null,
        department: department || null,
        is_active: true
      }
    });

    const payload = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      tenant_id: null
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef',
      { expiresIn: '24h' }
    );

    logger.info({ msg: 'Student registered', studentId: student.id, email });

    return res.status(201).json({
      message: 'Student account created successfully.',
      token,
      user: payload
    });
  } catch (error) {
    logger.error('Error registering student', { error: error.message });
    next(error);
  }
};

/**
 * Get own student profile
 * GET /api/v1/students/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        bio: true,
        university: true,
        department: true,
        graduation_year: true,
        languages: true,
        github_url: true,
        linkedin_url: true,
        portfolio_url: true,
        resume_url: true,
        domain: true,
        createdAt: true
      }
    });
    if (!student) return res.status(404).json({ message: 'Profile not found.' });
    return res.json({ student });
  } catch (error) {
    logger.error('Error fetching student profile', { error: error.message });
    next(error);
  }
};

/**
 * Update own student profile
 * PUT /api/v1/students/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name, bio, university, department, graduation_year,
      languages, github_url, linkedin_url, portfolio_url, resume_url, avatar_url
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(university !== undefined && { university }),
        ...(department !== undefined && { department }),
        ...(graduation_year !== undefined && { graduation_year: graduation_year ? parseInt(graduation_year) : null }),
        ...(languages !== undefined && { languages }),
        ...(github_url !== undefined && { github_url }),
        ...(linkedin_url !== undefined && { linkedin_url }),
        ...(portfolio_url !== undefined && { portfolio_url }),
        ...(resume_url !== undefined && { resume_url }),
        ...(avatar_url !== undefined && { avatar_url })
      },
      select: {
        id: true, name: true, email: true, avatar_url: true, bio: true,
        university: true, department: true, graduation_year: true,
        languages: true, github_url: true, linkedin_url: true,
        portfolio_url: true, resume_url: true
      }
    });

    return res.json({ message: 'Profile updated.', student: updated });
  } catch (error) {
    logger.error('Error updating student profile', { error: error.message });
    next(error);
  }
};

/**
 * Save an internship (bookmark)
 * POST /api/v1/students/saved/:programId
 */
const saveInternship = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { programId } = req.params;

    const program = await prisma.internshipProgram.findUnique({ where: { id: programId } });
    if (!program) return res.status(404).json({ message: 'Internship not found.' });

    await prisma.savedInternship.upsert({
      where: { user_id_program_id: { user_id: userId, program_id: programId } },
      update: {},
      create: { user_id: userId, program_id: programId }
    });

    return res.json({ message: 'Internship saved.' });
  } catch (error) {
    logger.error('Error saving internship', { error: error.message });
    next(error);
  }
};

/**
 * Remove a saved internship
 * DELETE /api/v1/students/saved/:programId
 */
const unsaveInternship = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { programId } = req.params;

    await prisma.savedInternship.deleteMany({
      where: { user_id: userId, program_id: programId }
    });

    return res.json({ message: 'Internship removed from saved list.' });
  } catch (error) {
    logger.error('Error unsaving internship', { error: error.message });
    next(error);
  }
};

/**
 * List all saved internships for the logged-in student
 * GET /api/v1/students/saved
 */
const getSavedInternships = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const saved = await prisma.savedInternship.findMany({
      where: { user_id: userId },
      include: {
        program: {
          include: {
            tenant: {
              select: { name: true, logo_url: true, subdomain: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return res.json({ saved });
  } catch (error) {
    logger.error('Error fetching saved internships', { error: error.message });
    next(error);
  }
};

/**
 * List all applications submitted by the logged-in student (matched by email)
 * GET /api/v1/students/applications
 */
const getMyApplications = async (req, res, next) => {
  try {
    const { email } = req.user;

    const applications = await prisma.application.findMany({
      where: { email },
      include: {
        program: {
          select: { title: true, category: true, type: true }
        },
        tenant: {
          select: { name: true, logo_url: true }
        }
      },
      orderBy: { status: 'asc' }
    });

    return res.json({ applications });
  } catch (error) {
    logger.error('Error fetching student applications', { error: error.message });
    next(error);
  }
};

module.exports = {
  registerStudent,
  getProfile,
  updateProfile,
  saveInternship,
  unsaveInternship,
  getSavedInternships,
  getMyApplications
};
