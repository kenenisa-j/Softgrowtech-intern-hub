// src/workers/certificateWorker.js
// BullMQ worker that generates a PDF certificate locally (free implementation)

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../utils/logger');
const prisma = require('../prisma/client'); // adjust path if needed
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { redisAvailable, registerMockWorker } = require('../config/redisQueue');

const PDF_GENERATION_QUEUE = 'pdfGenerationQueue';

// Helper to format timestamp
function formatTimestamp(date) {
  return date.toISOString().replace('T', ' ').split('.')[0];
}

// Worker processor logic
const processor = async (job) => {
  const { userId, internId, trackName } = job.data;
  logger.info({ msg: 'Generating certificate', userId, internId, trackName });

  // 1️⃣ Fetch user and tenant branding settings
  const [user, tenantSettings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.tenantSettings.findFirst({ where: { tenant_id: job.data.tenantId } }),
  ]);

  if (!user) {
    const errMsg = `User ${userId} not found`;
    logger.warn(errMsg);
    throw new Error(errMsg);
  }
  const brandColor = tenantSettings?.brand_color_hex || '#000000';

  // 2️⃣ Create PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const certFileName = `certificate-${userId}.pdf`;
  const outputPath = path.join(__dirname, '../../public/certificates', certFileName);
  
  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Title border
  doc
    .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
    .strokeColor(brandColor)
    .lineWidth(4)
    .stroke();

  // Header
  doc
    .fontSize(28)
    .fillColor('#333333')
    .text('Certificate of Completion', { align: 'center', underline: true });

  doc.moveDown(2);

  // Intern name and track
  doc
    .fontSize(20)
    .fillColor('#111111')
    .text(`This certifies that`, { align: 'center' })
    .moveDown(0.5)
    .font('Helvetica-Bold')
    .text(user.full_name || user.email, { align: 'center' })
    .moveDown(0.5)
    .font('Helvetica')
    .text(`has successfully completed the`, { align: 'center' })
    .moveDown(0.5)
    .font('Helvetica-Bold')
    .text(trackName, { align: 'center' })
    .moveDown(2);

  // Timestamp
  const now = new Date();
  doc
    .fontSize(12)
    .fillColor('#555555')
    .text(`Issued on: ${formatTimestamp(now)}`, { align: 'center' });

  // Finalize PDF
  doc.end();

  // Wait for the file to be fully written
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // 3️⃣ Update DB with public URL (assuming a Certificate model exists)
  const publicUrl = `http://localhost:5000/public/certificates/${certFileName}`;
  await prisma.certificate.upsert({
    where: { intern_id: internId },
    update: { url: publicUrl, generated_at: now },
    create: { intern_id: internId, url: publicUrl, generated_at: now },
  });

  logger.info({ msg: 'Certificate generated', userId, file: outputPath, url: publicUrl });
  return { url: publicUrl };
};

let certificateWorker;
let redisConnection;

if (redisAvailable) {
  redisConnection = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    maxRetriesPerRequest: null,
  });

  redisConnection.on('error', (err) => {
    logger.error('Redis worker connection error (Certificates)', { error: err.message });
  });

  certificateWorker = new Worker(PDF_GENERATION_QUEUE, processor, {
    connection: redisConnection,
    concurrency: 3
  });

  certificateWorker.on('completed', (job, result) => {
    logger.info({ msg: 'Certificate job completed', jobId: job.id, result });
  });

  certificateWorker.on('failed', (job, err) => {
    logger.error({ msg: 'Certificate job failed', jobId: job?.id, error: err?.message });
  });

  process.on('SIGINT', async () => {
    await certificateWorker.close();
    redisConnection.disconnect();
    process.exit(0);
  });
} else {
  registerMockWorker(PDF_GENERATION_QUEUE, processor);
  certificateWorker = {
    close: async () => {
      logger.info('Mock Certificate worker closed.');
    }
  };
}

module.exports = { certificateWorker, PDF_GENERATION_QUEUE };
