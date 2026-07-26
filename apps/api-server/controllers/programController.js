// apps/api-server/controllers/programController.js
// Handles internship program management, public listings, student applications, and onboarding pipelines.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../src/utils/email');

const formatProgram = (program) => {
  if (!program) return program;
  let skillsArr = [];
  if (typeof program.skills === 'string') {
    skillsArr = program.skills.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(program.skills)) {
    skillsArr = program.skills;
  }
  return { ...program, skills: skillsArr };
};

/**
 * Create a new Internship Program (Company Admin only)
 */
const createProgram = async (req, res, next) => {
  try {
    const {
      title, description, category, skills, type, is_paid, stipend,
      duration, start_date, end_date, positions, deadline,
      visibility, location, responsibilities, benefits, preferred_quals
    } = req.body;
    const tenantId = req.tenantId;

    if (!['ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only company administrators can create programs.' });
    }

    const processedSkills = Array.isArray(skills) ? skills.join(', ') : (skills || '');

    if (!title || !description || !category || !processedSkills || !start_date || !end_date || !deadline) {
      return res.status(400).json({ message: 'Missing required program fields.' });
    }

    // 1. Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant organization not found.' });
    }

    // 2. Create program record (save ALL form fields)
    const program = await prisma.internshipProgram.create({
      data: {
        tenant_id: tenantId,
        title,
        description,
        category,
        skills: processedSkills,
        type: type || 'ONSITE',
        is_paid: is_paid || false,
        stipend: stipend ? parseFloat(stipend) : null,
        duration: duration || null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        positions: positions ? parseInt(positions) : 5,
        deadline: new Date(deadline),
        status: 'OPEN',
        visibility: visibility || 'PUBLIC',
        location: location || null,
        responsibilities: responsibilities || null,
        benefits: benefits || null,
        preferred_quals: preferred_quals || null,
      }
    });

    logger.info({ msg: 'Internship program created', programId: program.id, tenantId });

    return res.status(201).json({
      message: 'Internship program created successfully.',
      program: formatProgram(program)
    });
  } catch (error) {
    logger.error('Error creating internship program', { error: error.message });
    next(error);
  }
};

/**
 * Edit an existing Internship Program (Company Admin only)
 */
const editProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, description, category, skills, type, is_paid, stipend,
      duration, start_date, end_date, positions, deadline, status,
      visibility, location, responsibilities, benefits, preferred_quals
    } = req.body;
    const tenantId = req.tenantId;

    if (!['ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only company administrators can edit programs.' });
    }

    const program = await prisma.internshipProgram.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!program) {
      return res.status(404).json({ message: 'Internship program not found.' });
    }

    const processedSkills = skills !== undefined ? (Array.isArray(skills) ? skills.join(', ') : skills) : undefined;

    const updatedProgram = await prisma.internshipProgram.update({
      where: { id },
      data: {
        title: title || program.title,
        description: description || program.description,
        category: category || program.category,
        skills: processedSkills !== undefined ? processedSkills : program.skills,
        type: type || program.type,
        is_paid: is_paid !== undefined ? is_paid : program.is_paid,
        stipend: stipend !== undefined ? (stipend ? parseFloat(stipend) : null) : program.stipend,
        duration: duration !== undefined ? duration : program.duration,
        start_date: start_date ? new Date(start_date) : program.start_date,
        end_date: end_date ? new Date(end_date) : program.end_date,
        positions: positions ? parseInt(positions) : program.positions,
        deadline: deadline ? new Date(deadline) : program.deadline,
        status: status || program.status,
        visibility: visibility || program.visibility,
        location: location !== undefined ? location : program.location,
        responsibilities: responsibilities !== undefined ? responsibilities : program.responsibilities,
        benefits: benefits !== undefined ? benefits : program.benefits,
        preferred_quals: preferred_quals !== undefined ? preferred_quals : program.preferred_quals,
      }
    });

    logger.info({ msg: 'Internship program updated', programId: id, tenantId });

    return res.json({
      message: 'Internship program updated successfully.',
      program: formatProgram(updatedProgram)
    });
  } catch (error) {
    logger.error('Error editing internship program', { error: error.message });
    next(error);
  }
};

/**
 * Delete / Archive an Internship Program
 */
const deleteProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!['ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only company administrators can delete programs.' });
    }

    const program = await prisma.internshipProgram.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!program) {
      return res.status(404).json({ message: 'Internship program not found.' });
    }

    // Soft delete by setting status to ARCHIVED
    await prisma.internshipProgram.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    logger.info({ msg: 'Internship program archived', programId: id, tenantId });

    return res.json({ message: 'Internship program archived successfully.' });
  } catch (error) {
    logger.error('Error deleting internship program', { error: error.message });
    next(error);
  }
};

/**
 * Fetch all programs under tenant (for administrators)
 */
const getTenantPrograms = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const programs = await prisma.internshipProgram.findMany({
      where: {
        tenant_id: tenantId,
        status: { not: 'ARCHIVED' }
      },
      orderBy: { start_date: 'desc' }
    });

    const formatted = programs.map(formatProgram);
    return res.json({ programs: formatted });
  } catch (error) {
    logger.error('Error fetching tenant programs', { error: error.message });
    next(error);
  }
};

/**
 * Public Listing: Browse and filter open programs (Unauthenticated)
 */
const getPublicPrograms = async (req, res, next) => {
  try {
    const { search, category, type, is_paid, company, location } = req.query;

    let whereClause = {
      status: 'OPEN',
      visibility: 'PUBLIC',
      deadline: { gte: new Date() }
    };

    if (category) whereClause.category = category;
    if (type) whereClause.type = type;
    if (is_paid) whereClause.is_paid = is_paid === 'true';
    if (location) whereClause.location = { contains: location };
    if (company) {
      whereClause.tenant = { name: { contains: company } };
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { skills: { contains: search } },
        { category: { contains: search } }
      ];
    }

    const programs = await prisma.internshipProgram.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logo_url: true,
            industry: true,
            location: true,
            is_verified: true,
            tenantSettings: { select: { logo_url: true } }
          }
        },
        _count: { select: { mentors: true, applications: true } }
      },
      orderBy: { deadline: 'asc' }
    });

    const formatted = programs.map(formatProgram);
    return res.json({ programs: formatted });
  } catch (error) {
    logger.error('Error fetching public program listings', { error: error.message });
    next(error);
  }
};

/**
 * Public Listing: Get detailed information for a single public program
 * GET /programs/public/:id
 */
const getPublicProgramDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const program = await prisma.internshipProgram.findFirst({
      where: {
        id,
        status: { not: 'ARCHIVED' }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logo_url: true,
            cover_url: true,
            industry: true,
            location: true,
            is_verified: true,
            description: true,
            website: true,
            company_size: true
          }
        },
        _count: { select: { applications: true } }
      }
    });

    if (!program) {
      return res.status(404).json({ message: 'Internship program not found.' });
    }

    // Fetch up to 3 similar internship programs (same category, different program ID)
    const similarPrograms = await prisma.internshipProgram.findMany({
      where: {
        category: program.category,
        id: { not: program.id },
        status: 'OPEN',
        visibility: 'PUBLIC',
        deadline: { gte: new Date() }
      },
      take: 3,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            is_verified: true
          }
        }
      }
    });

    return res.json({
      program: formatProgram(program),
      similar: similarPrograms.map(formatProgram)
    });
  } catch (error) {
    logger.error('Error fetching public program details', { error: error.message });
    next(error);
  }
};


/**
 * Platform-wide statistics for homepage hero
 * GET /programs/stats
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [orgCount, internshipCount, applicationCount] = await Promise.all([
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.internshipProgram.count({ where: { status: 'OPEN' } }),
      prisma.application.count()
    ]);

    return res.json({
      organizations: orgCount,
      internships: internshipCount,
      applications: applicationCount,
      // Static social proof numbers that grow over time
      countries: Math.max(12, Math.floor(orgCount * 0.4))
    });
  } catch (error) {
    logger.error('Error fetching platform stats', { error: error.message });
    next(error);
  }
};

/**
 * Distinct categories from live programs (for dynamic filter dropdowns)
 * GET /programs/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const programs = await prisma.internshipProgram.findMany({
      where: { status: 'OPEN', visibility: 'PUBLIC' },
      select: { category: true },
      distinct: ['category']
    });

    const categories = programs.map(p => p.category).filter(Boolean);

    // Always include the full curated list even if no live programs yet
    const curated = [
      'Software Engineering', 'Cybersecurity', 'AI & Data Science', 'Full-Stack Development',
      'Marketing', 'Accounting', 'Finance', 'Human Resources',
      'Nursing', 'Pharmacy', 'Laboratory Science',
      'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering',
      'Graphic Design', 'Photography', 'Video Editing',
      'Law', 'Agriculture', 'Education', 'Construction', 'Hospitality', 'Research'
    ];

    const merged = Array.from(new Set([...categories, ...curated]));
    return res.json({ categories: merged });
  } catch (error) {
    logger.error('Error fetching categories', { error: error.message });
    next(error);
  }
};

/**
 * Featured programs for homepage (6 latest open)
 * GET /programs/featured
 */
const getFeaturedPrograms = async (req, res, next) => {
  try {
    const programs = await prisma.internshipProgram.findMany({
      where: { status: 'OPEN', visibility: 'PUBLIC', deadline: { gte: new Date() } },
      include: {
        tenant: {
          select: {
            id: true, name: true, logo_url: true, is_verified: true, industry: true, location: true,
            tenantSettings: { select: { logo_url: true } }
          }
        },
        _count: { select: { applications: true } }
      },
      orderBy: { deadline: 'asc' },
      take: 6
    });
    return res.json({ programs: programs.map(formatProgram) });
  } catch (error) {
    logger.error('Error fetching featured programs', { error: error.message });
    next(error);
  }
};

/**
 * Submit an Application (Public candidate onboarding)
 */
const submitApplication = async (req, res, next) => {
  try {
    let { programId, name, email, coverLetter, portfolioLink, githubLink, linkedinLink, cvPath, cvFileName, cvFileData } = req.body;

    // Verify program exists and is open (resolve tenant_id from it)
    const program = await prisma.internshipProgram.findFirst({
      where: {
        id: programId,
        status: 'OPEN'
      }
    });

    if (!program) {
      return res.status(404).json({ message: 'Internship program is not open or does not exist.' });
    }

    const finalTenantId = program.tenant_id;

    // Decode and save base64 CV document if submitted on the fly
    if (cvFileData && cvFileName) {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const base64Data = cvFileData.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = path.extname(cvFileName) || '.pdf';
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(filePath, buffer);
      cvPath = `/uploads/${uniqueName}`;
    }

    let applicantUserId = null;
    if (req.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id }
      });
      if (dbUser) {
        if (!name) name = dbUser.name;
        if (!email) email = dbUser.email;
        if (!cvPath) cvPath = dbUser.resume_url;
        if (!portfolioLink) portfolioLink = dbUser.portfolio_url;
        if (!githubLink) githubLink = dbUser.github_url;
        if (!linkedinLink) linkedinLink = dbUser.linkedin_url;
        applicantUserId = dbUser.id;
      }
    }

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    if (!cvPath) {
      return res.status(400).json({ message: 'Please upload a resume in your profile or upload a document during application submission.' });
    }

    // Create candidate application
    const application = await prisma.application.create({
      data: {
        tenant_id: finalTenantId,
        program_id: programId,
        applicant_user_id: applicantUserId,
        name,
        email,
        cv_path: cvPath,
        cover_letter: coverLetter || null,
        portfolio_link: portfolioLink || null,
        github_link: githubLink || null,
        linkedin_link: linkedinLink || null,
        status: 'PENDING'
      }
    });


    // Notify organization admins
    const admins = await prisma.user.findMany({
      where: {
        tenant_id: finalTenantId,
        role: 'ORG_ADMIN'
      }
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          tenant_id: finalTenantId,
          user_id: admin.id,
          type: 'NEW_APPLICATION',
          content: `New application received from ${name} for "${program.title}".`
        }
      });

      try {
        await sendEmail({
          to: admin.email,
          subject: `New Application Received: ${program.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#2563EB">New Candidate Application</h2>
              <p>Hello ${admin.name || 'there'},</p>
              <p>A new application has been submitted for your internship program <strong>"${program.title}"</strong>:</p>
              <div style="padding:16px;background:#f3f4f6;border-radius:8px;margin:16px 0">
                <p style="margin:0 0 8px;font-size:14px"><strong>Candidate Name:</strong> ${name}</p>
                <p style="margin:0;font-size:14px"><strong>Candidate Email:</strong> ${email}</p>
              </div>
              <p>Please log in to your company dashboard to review the candidate's profile, resume, and credentials.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
              <p style="color:#6b7280;font-size:12px">InternHub · nextern.io</p>
            </div>
          `
        });
      } catch (err) {
        logger.error(`Failed to send application email notification to admin ${admin.email}`, { error: err.message });
      }
    }

    logger.info({ msg: 'Internship application submitted', applicationId: application.id, programId, tenantId: finalTenantId });

    return res.status(201).json({
      message: 'Application submitted successfully.',
      application
    });
  } catch (error) {
    logger.error('Error submitting application', { error: error.message });
    next(error);
  }
};

/**
 * Fetch all applications (Admins and Mentors)
 */
const getApplications = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { role, id: userId } = req.user;

    let whereClause = { tenant_id: tenantId };

    // Mentors can only view applications assigned to them
    if (role === 'MENTOR') {
      whereClause.assigned_mentor_id = userId;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        program: {
          select: {
            title: true,
            category: true
          }
        },
        mentor: {
          select: {
            name: true
          }
        }
      },
      orderBy: { status: 'asc' }
    });

    return res.json({ applications });
  } catch (error) {
    logger.error('Error fetching applications', { error: error.message });
    next(error);
  }
};

/**
 * Evaluate Application and trigger Auto-Onboarding Hook on ACCEPTED
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedMentorId } = req.body;
    const tenantId = req.tenantId;

    if (!['ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only company administrators can evaluate applications.' });
    }

    if (!['PENDING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid evaluation status.' });
    }

    // Fetch the application
    const application = await prisma.application.findFirst({
      where: { id, tenant_id: tenantId },
      include: { program: true }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // 1. Hook: Handle Auto-Onboarding if status transition is ACCEPTED
    if (status === 'ACCEPTED' && application.status !== 'ACCEPTED') {
      // A. Create the Intern User Record
      const tempPassword = `Pass${crypto.randomBytes(3).toString('hex')}!`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: application.email, tenant_id: tenantId }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'A user account already exists in your organization for this candidate email.' });
      }

      const internUser = await prisma.user.create({
        data: {
          name: application.name,
          email: application.email,
          password_hash: passwordHash,
          role: 'INTERN',
          domain: application.program.category || 'Full-Stack',
          tenant_id: tenantId,
          is_active: true
        }
      });

      // C. Assign mentor if provided
      if (assignedMentorId) {
        await prisma.application.update({
          where: { id },
          data: { assigned_mentor_id: assignedMentorId }
        });
      }

      // D. Dispatch Credentials email via Resend
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
      const emailSubject = 'Welcome to IMS - Your Internship Account is Ready!';
      const emailHtml = `
        <p>Dear ${application.name},</p>
        <p>Congratulations! Your application for the <strong>"${application.program.title}"</strong> internship program has been accepted.</p>
        <p>Your official intern account has been provisioned. You can now log in and complete your profile:</p>
        <p><strong>Login Portal:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Email Address:</strong> ${application.email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in and update your password immediately upon first access.</p>
        <br/>
        <p>Best regards,<br/>The IMS Team</p>
      `;

      try {
        await sendEmail({
          to: application.email,
          subject: emailSubject,
          html: emailHtml
        });
        logger.info({ msg: 'Onboarding invitation email sent', email: application.email });
      } catch (emailError) {
        logger.error('Failed to dispatch onboarding credentials email', { error: emailError.message });
      }
    }

    if (status === 'REJECTED' && application.status !== 'REJECTED') {
      try {
        await sendEmail({
          to: application.email,
          subject: `Update on your application: ${application.program.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#DC2626">Application Update</h2>
              <p>Dear ${application.name},</p>
              <p>Thank you for taking the time to apply for the <strong>"${application.program.title}"</strong> internship program.</p>
              <p>After careful review of all applications, we regret to inform you that we will not be moving forward with your application at this time.</p>
              <p>We appreciate your interest in our internship program and wish you the best of luck in your academic and professional endeavors.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
              <p style="color:#6b7280;font-size:12px">InternHub · nextern.io</p>
            </div>
          `
        });
        logger.info({ msg: 'Application rejection email sent', email: application.email });
      } catch (err) {
        logger.error('Failed to dispatch application rejection email', { error: err.message });
      }
    }

    // 2. Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        assigned_mentor_id: assignedMentorId || application.assigned_mentor_id
      },
      include: {
        mentor: {
          select: { name: true }
        }
      }
    });

    logger.info({ msg: 'Application status updated', applicationId: id, status, tenantId });

    return res.json({
      message: `Application successfully updated to ${status.toLowerCase()}.`,
      application: updatedRecord = updatedApplication
    });
  } catch (error) {
    logger.error('Error updating application status', { error: error.message });
    next(error);
  }
};

/**
 * Assign a mentor to a program (M:M junction)
 * POST /programs/:id/mentors
 */
const addMentorToProgram = async (req, res, next) => {
  try {
    const { id: programId } = req.params;
    const { mentorId } = req.body;
    const tenantId = req.tenantId;

    if (!['ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only org admins can assign mentors.' });
    }

    const program = await prisma.internshipProgram.findFirst({ where: { id: programId, tenant_id: tenantId } });
    if (!program) return res.status(404).json({ message: 'Program not found.' });

    const mentor = await prisma.user.findFirst({ where: { id: mentorId, tenant_id: tenantId, role: 'MENTOR' } });
    if (!mentor) return res.status(404).json({ message: 'Mentor not found in your organization.' });

    await prisma.programMentor.upsert({
      where: { program_id_user_id: { program_id: programId, user_id: mentorId } },
      update: {},
      create: { program_id: programId, user_id: mentorId }
    });

    logger.info({ msg: 'Mentor assigned to program', programId, mentorId });
    return res.json({ message: 'Mentor assigned to program successfully.' });
  } catch (error) {
    logger.error('Error assigning mentor to program', { error: error.message });
    next(error);
  }
};

/**
 * Remove a mentor from a program
 * DELETE /programs/:id/mentors/:mentorId
 */
const removeMentorFromProgram = async (req, res, next) => {
  try {
    const { id: programId, mentorId } = req.params;
    const tenantId = req.tenantId;

    if (!['ORG_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only org admins can remove mentors.' });
    }

    await prisma.programMentor.deleteMany({
      where: { program_id: programId, user_id: mentorId }
    });

    return res.json({ message: 'Mentor removed from program.' });
  } catch (error) {
    logger.error('Error removing mentor from program', { error: error.message });
    next(error);
  }
};

/**
 * List all mentors assigned to a program
 * GET /programs/:id/mentors
 */
const getProgramMentors = async (req, res, next) => {
  try {
    const { id: programId } = req.params;

    const rows = await prisma.programMentor.findMany({
      where: { program_id: programId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true, domain: true }
        }
      }
    });

    return res.json({ mentors: rows.map(r => r.user) });
  } catch (error) {
    logger.error('Error fetching program mentors', { error: error.message });
    next(error);
  }
};

/**
 * Get the program an intern is enrolled in
 * GET /programs/my-program  (intern)
 */
const getMyInternProgram = async (req, res, next) => {
  try {
    const { id: userId, tenant_id } = req.user;
    // Find an application that was ACCEPTED for this user (by email match)
    const application = await prisma.application.findFirst({
      where: {
        email: req.user.email,
        status: 'ACCEPTED',
        ...(tenant_id ? { tenant_id } : {})
      },
      include: {
        program: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!application || !application.program) {
      return res.json({ program: null });
    }

    return res.json({ program: application.program });
  } catch (error) {
    logger.error('Error fetching intern program', { error: error.message });
    next(error);
  }
};

module.exports = {
  createProgram,
  editProgram,
  deleteProgram,
  getTenantPrograms,
  getMyInternProgram,
  getPublicPrograms,
  getPublicProgramDetails,
  getPlatformStats,
  getCategories,
  getFeaturedPrograms,
  submitApplication,
  getApplications,
  updateApplicationStatus,
  addMentorToProgram,
  removeMentorFromProgram,
  getProgramMentors
};
