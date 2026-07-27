// src/utils/email.js
// Sends transactional emails via Resend (https://resend.com)

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'InternHub <no-reply@nextern.io>';

/**
 * Send an email via Resend.
 * @param {{ to: string|string[], subject: string, html: string }} options
 */
async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error('sendEmail error:', error?.message || error);
    // Non-fatal — don't crash the request if email fails
    return null;
  }
}

module.exports = { sendEmail };
