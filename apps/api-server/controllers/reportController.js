// apps/api-server/controllers/reportController.js
// Handles PDF compilation of progress reports, attendance, and QR-verified certificates using PDFKit.

const prisma = require('../src/prisma/client');
const logger = require('../src/utils/logger');
const PDFDocument = require('pdfkit');
const axios = require('axios');

/**
 * Generate PDF Attendance Report
 */
const exportAttendanceReport = async (req, res, next) => {
  try {
    const { internId } = req.params;
    const tenantId = req.tenantId;

    // Verify requesting user is allowed to access
    if (req.user.role === 'INTERN' && req.user.id !== internId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const intern = await prisma.user.findFirst({
      where: { id: internId, tenant_id: tenantId }
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    const logs = await prisma.attendance.findMany({
      where: { intern_id: internId, tenant_id: tenantId },
      orderBy: { date: 'desc' }
    });

    // Create PDF Document
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${intern.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Title / Header
    doc.fillColor('#0D0D12').fontSize(22).text('Attendance & Punch Logs Report', { align: 'center' });
    doc.fontSize(10).fillColor('#6B7280').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Profile Details
    doc.fillColor('#1F2937').fontSize(12).text(`Intern Name: ${intern.name}`);
    doc.text(`Track/Domain: ${intern.domain}`);
    doc.text(`Email Address: ${intern.email}`);
    doc.moveDown(1.5);

    // Draw table header
    doc.fillColor('#F3F4F6').rect(50, doc.y, 500, 20).fill();
    doc.fillColor('#1F2937').fontSize(9).text('Date', 60, doc.y + 5);
    doc.text('Check-In', 180, doc.y);
    doc.text('Check-Out', 300, doc.y);
    doc.text('Status', 420, doc.y);
    doc.moveDown(1.5);

    // Draw rows
    logs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0];
      const checkInStr = log.check_in ? new Date(log.check_in).toLocaleTimeString() : 'N/A';
      const checkOutStr = log.check_out ? new Date(log.check_out).toLocaleTimeString() : 'N/A';
      const statusStr = log.status;

      doc.fillColor('#374151').fontSize(9).text(dateStr, 60, doc.y);
      doc.text(checkInStr, 180, doc.y - 12);
      doc.text(checkOutStr, 300, doc.y - 12);
      doc.text(statusStr, 420, doc.y - 12);
      doc.moveDown(1);
    });

    doc.end();
  } catch (error) {
    logger.error('Error generating attendance PDF report', { error: error.message });
    next(error);
  }
};

/**
 * Generate PDF Evaluation / Progress Report
 */
const exportEvaluationReport = async (req, res, next) => {
  try {
    const { internId } = req.params;
    const tenantId = req.tenantId;

    if (req.user.role === 'INTERN' && req.user.id !== internId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const intern = await prisma.user.findFirst({
      where: { id: internId, tenant_id: tenantId }
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { intern_id: internId, tenant_id: tenantId },
      include: {
        mentor: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Evaluation_Report_${intern.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Title / Header
    doc.fillColor('#0D0D12').fontSize(22).text('Intern Skill Evaluation Report', { align: 'center' });
    doc.fontSize(10).fillColor('#6B7280').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Profile Details
    doc.fillColor('#1F2937').fontSize(12).text(`Intern Name: ${intern.name}`);
    doc.text(`Track/Domain: ${intern.domain}`);
    doc.text(`Email Address: ${intern.email}`);
    doc.moveDown(2);

    evaluations.forEach((evalItem, index) => {
      doc.fontSize(14).fillColor('#4F46E5').text(`${evalItem.type} Evaluation - ${new Date(evalItem.date).toLocaleDateString()}`);
      doc.fontSize(10).fillColor('#4B5563').text(`Evaluated by Mentor: ${evalItem.mentor.name}`);
      doc.moveDown(0.5);

      // Criteria Scores
      doc.fillColor('#1F2937');
      doc.text(`• Technical Skills: ${evalItem.technical_skills}/10`);
      doc.text(`• Communication: ${evalItem.communication}/10`);
      doc.text(`• Teamwork: ${evalItem.teamwork}/10`);
      doc.text(`• Problem Solving: ${evalItem.problem_solving}/10`);
      doc.text(`• Attendance: ${evalItem.attendance}/10`);
      doc.text(`• Professionalism: ${evalItem.professionalism}/10`);
      
      const overall = parseFloat(evalItem.overall_score).toFixed(2);
      doc.font('Helvetica-Bold').fillColor('#111827').text(`Overall Average Score: ${overall}/10`);
      doc.font('Helvetica').fillColor('#4B5563').text(`Comments: ${evalItem.comments || 'No remarks.'}`);
      
      doc.moveDown(1.5);
      if (index < evaluations.length - 1) {
        doc.strokeColor('#E5E7EB').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);
      }
    });

    doc.end();
  } catch (error) {
    logger.error('Error generating evaluation PDF report', { error: error.message });
    next(error);
  }
};

/**
 * Generate PDF Certificate of Completion with digital signature and QR verification code
 */
const exportCertificate = async (req, res, next) => {
  try {
    const { internId } = req.params;
    const tenantId = req.tenantId;

    if (req.user.role === 'INTERN' && req.user.id !== internId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const intern = await prisma.user.findFirst({
      where: { id: internId, tenant_id: tenantId, role: 'INTERN' }
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found.' });
    }

    // Verify they have completed a final evaluation
    const finalEval = await prisma.evaluation.findFirst({
      where: { intern_id: internId, tenant_id: tenantId, type: 'FINAL' },
      include: { mentor: true }
    });

    if (!finalEval) {
      return res.status(400).json({ message: 'Intern has not completed their final evaluation yet. Certificate is locked.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    // Check if certificate record already exists, otherwise create it
    let certificate = await prisma.certificate.findFirst({
      where: { intern_id: internId }
    });

    if (!certificate) {
      // Create relative URL or target verification link
      const uniqueCertId = crypto.randomUUID();
      certificate = await prisma.certificate.create({
        data: {
          id: uniqueCertId,
          intern_id: internId,
          url: `/verify/certificate/${uniqueCertId}`
        }
      });
    }

    // Fetch QR Code image from public API as buffer
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${appUrl}/verify/certificate/${certificate.id}`;
    let qrBuffer = null;
    try {
      const qrResponse = await axios.get(`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`, {
        responseType: 'arraybuffer'
      });
      qrBuffer = Buffer.from(qrResponse.data);
    } catch (qrErr) {
      logger.warn('Failed to fetch QR code from api.qrserver.com, proceeding without QR image', { error: qrErr.message });
    }

    // Create a horizontal Landscape PDF document for the certificate
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${intern.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Decorative Borders
    doc.lineWidth(15).strokeColor('#09090B').rect(20, 20, 802, 555).stroke(); // Outer dark border
    doc.lineWidth(2).strokeColor('#DB2777').rect(35, 35, 772, 525).stroke();  // Inner Fuchsia accent border

    // Company Header / Brand
    doc.fillColor('#1F2937').fontSize(14).font('Helvetica-Bold').text(tenant.name.toUpperCase(), { align: 'center', dy: 50 });
    doc.moveDown(1.5);

    // Title
    doc.fillColor('#DB2777').fontSize(32).font('Helvetica-Bold').text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown(1);

    // Body text
    doc.fillColor('#4B5563').fontSize(16).font('Helvetica').text('This is proudly presented to', { align: 'center' });
    doc.moveDown(0.8);

    // Intern Name
    doc.fillColor('#111827').fontSize(28).font('Helvetica-Bold').text(intern.name, { align: 'center' });
    doc.moveDown(1);

    // Program Description text
    doc.fillColor('#4B5563').fontSize(14).font('Helvetica').text(
      `for successfully completing their professional internship program in the domain track of\n"${intern.domain}" at ${tenant.name}.\n\nThe candidate demonstrated exceptional skills, dedication, and professional ethics.`,
      { align: 'center', lineGap: 6 }
    );
    doc.moveDown(3);

    // Signatures and QR Code
    const yPosSignatures = doc.y;

    // Left Side: Mentor Sign-off
    doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(60, yPosSignatures).lineTo(260, yPosSignatures).stroke();
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(finalEval.mentor.name, 60, yPosSignatures + 10);
    doc.fillColor('#6B7280').font('Helvetica').text('Assigned Program Mentor', 60, yPosSignatures + 24);
    
    // Digital Signature text (cursive simulation)
    doc.fillColor('#DB2777').fontSize(16).font('Times-Italic').text(`~ ${finalEval.mentor.name} ~`, 70, yPosSignatures - 25);

    // Right Side: Org Admin Sign-off
    doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(580, yPosSignatures).lineTo(780, yPosSignatures).stroke();
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('Corporate Director', 580, yPosSignatures + 10);
    doc.fillColor('#6B7280').font('Helvetica').text(tenant.name, 580, yPosSignatures + 24);
    doc.fillColor('#DB2777').fontSize(16).font('Times-Italic').text('~ Authorized Signature ~', 590, yPosSignatures - 25);

    // Center: QR Code Image
    if (qrBuffer) {
      doc.image(qrBuffer, 371, yPosSignatures - 60, { width: 100, height: 100 });
      doc.fillColor('#9CA3AF').fontSize(8).text('Scan to Verify Authenticity', 350, yPosSignatures + 45, { width: 140, align: 'center' });
    }

    doc.end();
  } catch (error) {
    logger.error('Error generating certificate PDF', { error: error.message });
    next(error);
  }
};

/**
 * Public Verification Endpoint for QR Code scans
 */
const verifyCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        // Find intern details
      }
    });

    if (!certificate) {
      return res.status(404).json({ authentic: false, message: 'Certificate record not found. Verification failed.' });
    }

    // Fetch Intern details
    const intern = await prisma.user.findFirst({
      where: { id: certificate.intern_id },
      include: {
        tenant: true
      }
    });

    if (!intern) {
      return res.status(404).json({ authentic: false, message: 'Intern record associated with this certificate not found.' });
    }

    // Fetch Mentor details
    const finalEval = await prisma.evaluation.findFirst({
      where: { intern_id: intern.id, type: 'FINAL' },
      include: { mentor: true }
    });

    return res.json({
      authentic: true,
      certificateId: certificate.id,
      generatedAt: certificate.generated_at,
      internName: intern.name,
      domain: intern.domain,
      companyName: intern.tenant?.name || 'IMS Partner Organization',
      mentorName: finalEval?.mentor?.name || 'Program Lead',
      overallScore: finalEval ? parseFloat(finalEval.overall_score) : null
    });
  } catch (error) {
    logger.error('Error verifying certificate', { error: error.message });
    next(error);
  }
};

module.exports = {
  exportAttendanceReport,
  exportEvaluationReport,
  exportCertificate,
  verifyCertificate
};
