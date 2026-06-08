// server.js
// Entry point that creates an HTTP server, attaches the Express app, and initializes Socket.io.

const http = require('http');
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { initSocket } = require('./src/websocket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the server
initSocket(server);

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

module.exports = server;

