// apps/api-server/controllers/inviteController.js
// Handles secure invite token generation and acceptance for accepted applicants.

const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const prisma = require('../src/prisma/client')
const logger = require('../src/utils/logger')

const INVITE_EXPIRY_HOURS = 72

/**
 * Generate a secure invite token for an accepted applicant.
 * POST /invites/generate
 * Body: { applicationId }
 */
const generateInvite = async (req, res) => {
  try {
    const { applicationId } = req.body
    const tenantId = req.tenantId

    const application = await prisma.application.findFirst({
      where: { id: applicationId, tenant_id: tenantId },
      include: { program: { select: { id: true, title: true } }, tenant: { select: { name: true } } }
    })
    if (!application) return res.status(404).json({ message: 'Application not found.' })
    if (application.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Invite can only be sent for ACCEPTED applications.' })
    }

    // Create or look up the pre-user record (placeholder user for invite)
    let user = await prisma.user.findFirst({
      where: { email: application.email, tenant_id: tenantId }
    })

    if (!user) {
      // Create placeholder user — no password yet, token will set it
      user = await prisma.user.create({
        data: {
          tenant_id: tenantId,
          name: application.name,
          email: application.email,
          password_hash: '',
          role: 'INTERN',
          domain: application.program?.title || 'General',
          is_active: false  // activated when invite is accepted
        }
      })
    }

    // Clean up any existing unused tokens for this user
    await prisma.inviteToken.deleteMany({ where: { user_id: user.id } })

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS)

    const inviteToken = await prisma.inviteToken.create({
      data: {
        token: uuidv4(),
        user_id: user.id,
        expires_at: expiresAt
      }
    })

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${inviteToken.token}`

    // In dev — log to console (Resend may not be set up)
    logger.info({
      msg: 'Invite token generated',
      email: application.email,
      inviteUrl,
      expiresAt
    })

    // Attempt to send email (non-blocking)
    try {
      const { sendEmail } = require('../src/utils/email')
      await sendEmail({
        to: application.email,
        subject: `You've been accepted to ${application.program?.title} at ${application.tenant?.name}!`,
        html: `
          <h2>Congratulations, ${application.name}!</h2>
          <p>You have been accepted to the <strong>${application.program?.title}</strong> internship program at <strong>${application.tenant?.name}</strong>.</p>
          <p>Click the link below to set up your account and get started:</p>
          <a href="${inviteUrl}" style="background:#a855f7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Accept Invite & Set Password</a>
          <p style="margin-top:16px;color:#888;font-size:12px;">This link expires in ${INVITE_EXPIRY_HOURS} hours.</p>
        `
      })
      logger.info({ msg: 'Invite email sent', email: application.email })
    } catch (emailErr) {
      logger.warn({ msg: 'Could not send invite email (non-fatal)', error: emailErr.message })
    }

    return res.json({
      message: 'Invite generated successfully.',
      inviteUrl,
      token: inviteToken.token,
      expiresAt
    })
  } catch (error) {
    logger.error('Error generating invite', { error: error.message })
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

/**
 * Verify an invite token (used by frontend before showing password form).
 * GET /invites/verify/:token
 */
const verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.params
    const record = await prisma.inviteToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, is_active: true,
            tenant: { select: { id: true, name: true, logo_url: true } }
          }
        }
      }
    })

    if (!record) return res.status(404).json({ valid: false, message: 'Invite not found or already used.' })
    if (new Date() > record.expires_at) {
      return res.status(400).json({ valid: false, message: 'This invite link has expired.' })
    }
    if (record.user.is_active) {
      return res.status(400).json({ valid: false, message: 'This invite has already been accepted.' })
    }

    return res.json({
      valid: true,
      name: record.user.name,
      email: record.user.email,
      organization: record.user.tenant?.name,
      orgLogo: record.user.tenant?.logo_url,
      expiresAt: record.expires_at
    })
  } catch (error) {
    logger.error('Error verifying invite token', { error: error.message })
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

/**
 * Accept an invite: set password and activate user account.
 * POST /invites/accept
 * Body: { token, password }
 */
const acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const record = await prisma.inviteToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!record) return res.status(404).json({ message: 'Invalid or already used invite token.' })
    if (new Date() > record.expires_at) {
      return res.status(400).json({ message: 'This invite link has expired. Please contact your organization.' })
    }
    if (record.user.is_active) {
      return res.status(400).json({ message: 'This account is already active. Please sign in.' })
    }

    const password_hash = await bcrypt.hash(password, 12)

    // Activate user + delete token atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.user_id },
        data: { password_hash, is_active: true }
      }),
      prisma.inviteToken.delete({ where: { token } })
    ])

    logger.info({ msg: 'Invite accepted, account activated', userId: record.user_id })
    return res.json({ message: 'Account activated successfully. You can now sign in.' })
  } catch (error) {
    logger.error('Error accepting invite', { error: error.message })
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

module.exports = { generateInvite, verifyInviteToken, acceptInvite }
