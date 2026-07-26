const express = require('express');
const cors = require('cors');
const path = require('path');
const Sentry = require('@sentry/node');
const logger = require('./utils/logger');

// Load environment configurations
require('dotenv').config();

// Verify Sentry configuration
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Enable HTTP call tracing
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    tracesSampleRate: 1.0, // Adjust in production to throttle volume
  });
  logger.info('Sentry Node SDK initialized successfully.');
} else {
  logger.warn('Sentry DSN is not defined. Error tracking is disabled.');
}

const app = express();

// Sentry Handlers must be placed before all other middleware and handlers
if (sentryDsn) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Global Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static file serving for uploads and certificates
// NOTE: In serverless environments (Vercel) these paths are ephemeral.
// For production, replace with cloud storage (S3/GCS) URL references.
app.use('/public', express.static(path.join(__dirname, '..', 'public')))

// Multi-tenant context resolver middleware
const tenantResolver = require('./middlewares/tenantResolver');
app.use(tenantResolver);

// Import database pool connection test (existing functionality)
require('../config/db');

// Import routes (resolving sibling folder mapping)
const authRoutes = require('../routes/authRoutes');
const taskRoutes = require('../routes/taskRoutes');
const submissionRoutes = require('../routes/submissionRoutes');
const organizationRoutes = require('../routes/organizationRoutes');
const superadminRoutes = require('../routes/superadminRoutes');
const billingRoutes = require('../routes/billingRoutes');
const onboardingRoutes = require('../routes/onboardingRoutes');
const adminRoutes = require('../routes/adminRoutes');
const attendanceRoutes = require('../routes/attendanceRoutes');
const programRoutes = require('../routes/programRoutes');
const evaluationRoutes = require('../routes/evaluationRoutes');
const chatRoutes = require('../routes/chatRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const uploadRoutes = require('../routes/uploadRoutes');
const reportRoutes = require('../routes/reportRoutes');
const studentRoutes = require('../routes/studentRoutes');
const inviteRoutes = require('../routes/inviteRoutes');
const reviewRoutes = require('../routes/reviewRoutes');
const programController = require('../controllers/programController');
const { verifyToken } = require('../middleware/authMiddleware');


// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1', onboardingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/evaluations', evaluationRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/invites', inviteRoutes);
app.use('/api/v1/reviews', reviewRoutes);
const userRoutes = require('../routes/userRoutes');
app.use('/api/v1/users', userRoutes);

const applicationsRouter = express.Router();
applicationsRouter.post('/', verifyToken, programController.submitApplication);
app.use('/api/v1/applications', applicationsRouter);


const assessmentRoutes = require('./routes/assessmentRoutes');
const exportRoutes = require('./routes/exportRoutes');
const complianceRoutes = require('./routes/complianceRoutes');

app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/compliance', complianceRoutes);
// Root endpoint status check
app.get('/', (req, res) => {
  res.json({ message: 'Internship Management System API is running successfully.' });
});

// Verification/Debug route for Sentry Integration
app.get('/debug-sentry', (req, res) => {
  throw new Error('Sentry Integration Verification Exception');
});

// Sentry Error Handler must be placed after all controllers but before any other error middleware
if (sentryDsn) {
  app.use(Sentry.Handlers.errorHandler());
}

// Global Custom Error Middleware
app.use((err, req, res, next) => {
  // Capture transaction metadata if available
  const meta = {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  };

  // If Sentry logged the error, it appends res.sentry event ID
  if (res.sentry) {
    meta.sentryEventId = res.sentry;
  }

  console.error('SERVER EXCEPTION DETECTED:', err);
  logger.error('Unhandled server exception captured by global error handler', meta);

  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
    sentryEventId: res.sentry || null,
  });
});

module.exports = app;
