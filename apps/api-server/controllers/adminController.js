const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../src/utils/email');

// Provision a new user (admin only)
const provisionUser = async (req, res, next) => {
  const { name, email, role, domain } = req.body;
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  const normalizedRole = role.toUpperCase();
  if (!['MENTOR', 'INTERN'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Invalid role. Must be MENTOR or INTERN.' });
  }

  const userDomain = domain || 'Full-Stack';

  try {
    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenant_id: tenantId }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email in your organization.' });
    }

    // Intern Capacity Check Gating (Removed - unlimited free version)

    // 2. Generate secure temporary password
    const tempPassword = `TempPass${crypto.randomBytes(3).toString('hex')}!`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // 3. Save record to database
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: normalizedRole,
        domain: userDomain,
        tenant_id: tenantId,
        is_active: true
      }
    });

    // 4. Send Credentials Email via Resend
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    
    let emailSubject = '';
    let emailHtml = '';

    if (normalizedRole === 'MENTOR') {
      emailSubject = 'Welcome to IMS - Mentor Account Provisioned';
      emailHtml = `
        <p>Dear ${name},</p>
        <p>Your Mentor account has been successfully created in the Internship Management System (IMS).</p>
        <p>You can access your private mentor dashboard to manage interns and tasks using the following credentials:</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Username/Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in and reset your password immediately upon access.</p>
        <br/>
        <p>Best regards,<br/>The IMS Admin Team</p>
      `;
    } else {
      emailSubject = 'Welcome to IMS - Intern Onboarding Invitation';
      emailHtml = `
        <p>Dear ${name},</p>
        <p>Welcome! An Intern account has been provisioned for you on the Internship Management System (IMS).</p>
        <p>Your onboarding details are as follows:</p>
        <p><strong>Assigned Program Domain:</strong> ${userDomain}</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Username/Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please log in to your dashboard to complete your profile, check assignments, and verify your program track.</p>
        <br/>
        <p>Best regards,<br/>The IMS Admin Team</p>
      `;
    }

    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml
      });
      logger.info({ msg: 'Provisioning welcome email sent successfully', email, role: normalizedRole });
    } catch (emailError) {
      logger.error('Failed to send onboarding credentials email', { error: emailError.message, email });
    }

    logger.info({ msg: 'Admin provisioned user successfully', userId: createdUser.id, role: normalizedRole, tenantId });

    return res.status(201).json({
      message: 'User provisioned successfully.',
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        domain: createdUser.domain
      }
    });
  } catch (error) {
    logger.error('Failed to provision user', { error: error.message, tenantId });
    next(error);
  }
};

// Retrieve users under tenant
const getTenantUsers = async (req, res, next) => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        tenant_id: tenantId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        domain: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({ users });
  } catch (error) {
    logger.error('Failed to retrieve tenant users', { error: error.message, tenantId });
    next(error);
  }
};

const getTenantMentors = async (req, res, next) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }
  try {
    const mentors = await prisma.user.findMany({
      where: { tenant_id: tenantId, role: 'MENTOR' },
      select: { id: true, name: true, email: true, domain: true, createdAt: true }
    });
    return res.json({ mentors });
  } catch (error) {
    next(error);
  }
};

const getTenantInterns = async (req, res, next) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }
  try {
    const interns = await prisma.user.findMany({
      where: { tenant_id: tenantId, role: 'INTERN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        domain: true,
        is_active: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    const internIds = interns.map(i => i.id);
    const applications = await prisma.application.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ACCEPTED',
        applicant_user_id: { in: internIds }
      },
      include: {
        program: { select: { id: true, title: true } },
        mentor: { select: { id: true, name: true } }
      }
    });

    const appMap = {};
    applications.forEach(app => {
      if (app.applicant_user_id) {
        appMap[app.applicant_user_id] = app;
      }
    });

    const formattedInterns = interns.map(intern => {
      const acceptedApp = appMap[intern.id] || {};
      return {
        id: intern.id,
        name: intern.name,
        email: intern.email,
        role: intern.role,
        domain: intern.domain,
        is_active: intern.is_active,
        status: intern.is_active ? 'ACTIVE' : 'INACTIVE',
        createdAt: intern.createdAt,
        program: acceptedApp.program || null,
        mentor: acceptedApp.mentor || null
      };
    });

    return res.json({ interns: formattedInterns });
  } catch (error) {
    logger.error('Failed to retrieve tenant interns', { error: error.message, tenantId });
    next(error);
  }
};

const provisionIntern = async (req, res, next) => {
  const { name, email, programId, mentorId } = req.body;
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant context is missing.' });
  }

  if (!name || !email || !programId) {
    return res.status(400).json({ message: 'Name, email, and programId are required.' });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email, tenant_id: tenantId }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account with this email already exists in your organization.' });
    }

    // Intern capacity limit check (Removed - unlimited free version)

    const tempPassword = `TempPass${crypto.randomBytes(3).toString('hex')}!`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const program = await prisma.internshipProgram.findUnique({
      where: { id: programId }
    });
    const domain = program ? program.category : 'Full-Stack';

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password_hash: passwordHash,
          role: 'INTERN',
          domain,
          tenant_id: tenantId,
          is_active: true
        }
      });

      const app = await tx.application.create({
        data: {
          tenant_id: tenantId,
          program_id: programId,
          applicant_user_id: user.id,
          assigned_mentor_id: mentorId || null,
          name,
          email,
          cv_path: '/uploads/placeholder-cv.pdf',
          status: 'ACCEPTED'
        }
      });

      return { user, app };
    });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const emailSubject = 'Welcome to IMS - Intern Onboarding Invitation';
    const emailHtml = `
      <p>Dear ${name},</p>
      <p>Welcome! An Intern account has been provisioned for you on the Internship Management System (IMS).</p>
      <p>Your onboarding details are as follows:</p>
      <p><strong>Assigned Program:</strong> ${program ? program.title : 'General'}</p>
      <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><strong>Username/Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>Please log in to your dashboard to complete your profile, check assignments, and verify your program track.</p>
      <br/>
      <p>Best regards,<br/>The IMS Admin Team</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml
      });
    } catch (emailError) {
      logger.error('Failed to send onboarding email', { error: emailError.message });
    }

    return res.status(201).json({
      message: 'Intern provisioned successfully.',
      user: result.user
    });
  } catch (error) {
    logger.error('Error provisioning intern', { error: error.message });
    next(error);
  }
};

module.exports = {
  provisionUser,
  getTenantUsers,
  getTenantMentors,
  getTenantInterns,
  provisionIntern
};
