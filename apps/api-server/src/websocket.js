// src/websocket.js
// Initializes Socket.io server, authenticates connections via JWT, and joins tenant-specific rooms.

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

let ioInstance = null;

/**
 * Initialize Socket.io with the given HTTP server.
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust in production
      methods: ['GET', 'POST']
    }
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        logger.warn('JWT_SECRET not set');
        return next(new Error('Server misconfiguration'));
      }
      const payload = jwt.verify(token, secret);
      socket.data.user = payload;
      return next();
    } catch (err) {
      logger.error('Socket JWT verification failed', { error: err.message });
      return next(new Error('Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const tenantId = socket.data.user?.tenant_id;
    if (tenantId) {
      const room = `tenant_${tenantId}`;
      socket.join(room);
      logger.info('Socket connected and joined room', { socketId: socket.id, room });
    }

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });
}

/**
 * Export a helper to emit notifications to a tenant room.
 */
function emitTenantNotification(tenantId, event, payload) {
  if (!ioInstance) {
    logger.warn('Socket.io server not initialized. Cannot emit event.', { tenantId, event });
    return;
  }
  const room = `tenant_${tenantId}`;
  ioInstance.to(room).emit(event, payload);
  logger.info('Emitted tenant notification', { tenantId, event });
}

module.exports = { initSocket, emitTenantNotification };
