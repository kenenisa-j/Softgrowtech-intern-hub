// server.js
// Entry point that creates an HTTP server, attaches the Express app, and initializes Socket.io.

const http = require('http');
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io only outside Vercel (serverless doesn't support persistent connections)
if (!process.env.VERCEL) {
  const { initSocket } = require('./src/websocket');
  initSocket(server);

  // Import and start background BullMQ worker services (not compatible with serverless)
  try {
    require('./src/workers/aiReviewWorker');
    require('./src/workers/certificateWorker');
    logger.info('Background message queue workers (AI Review & PDF Certificates) online.');
  } catch (err) {
    logger.warn('Background workers failed to start (non-critical):', err.message);
  }

  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

module.exports = server;
