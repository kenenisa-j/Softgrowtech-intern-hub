const express = require('express');
const cors = require('cors');
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
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (req.originalUrl && req.originalUrl.includes('/api/v1/billing/webhook')) {
      req.rawBody = buf;
    }
  }
}));

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

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/billing', billingRoutes);

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

  logger.error('Unhandled server exception captured by global error handler', meta);

  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
    sentryEventId: res.sentry || null,
  });
});

module.exports = app;
