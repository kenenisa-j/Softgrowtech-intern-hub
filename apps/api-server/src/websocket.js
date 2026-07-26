// src/websocket.js
// Initializes Socket.io server, authenticates connections via JWT, and handles private room chat and read receipts.

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');
const prisma = require('./utils/prisma');

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

  // JWT auth middleware for Socket.io
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token missing'));
    }
    try {
      const secret = process.env.JWT_SECRET || 'b49fca92c813a2957b102143df8c7c10b784a91aef';
      const payload = jwt.verify(token, secret);
      socket.data.user = payload;
      return next();
    } catch (err) {
      logger.error('Socket JWT verification failed', { error: err.message });
      return next(new Error('Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const tenantId = socket.data.user?.tenantId || socket.data.user?.tenant_id;
    const userId = socket.data.user?.id || socket.data.user?.userId;

    if (tenantId) {
      const tenantRoom = `tenant_${tenantId}`;
      socket.join(tenantRoom);
    }

    if (userId) {
      const userRoom = `user_${userId}`;
      socket.join(userRoom);
      logger.info('Socket connected', { socketId: socket.id, userId, tenantId });
    }

    // Handle sending a private message
    socket.on('send_message', async (payload, callback) => {
      try {
        const { receiverId, content, filePath, fileName } = payload;
        const senderId = userId;

        if (!receiverId) {
          if (callback) callback({ error: 'Receiver ID is required.' });
          return;
        }

        // Persist message to database
        const message = await prisma.message.create({
          data: {
            tenant_id: tenantId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content || null,
            file_path: filePath || null,
            file_name: fileName || null,
            is_read: false
          },
          include: {
            sender: {
              select: { name: true, role: true }
            }
          }
        });

        // Broadcast to recipient room
        ioInstance.to(`user_${receiverId}`).emit('receive_message', message);
        // Broadcast back to sender (to sync multiple tabs)
        ioInstance.to(`user_${senderId}`).emit('receive_message', message);

        // Notify recipient in-app
        await prisma.notification.create({
          data: {
            tenant_id: tenantId,
            user_id: receiverId,
            type: 'NEW_MESSAGE',
            content: `You received a new message from ${message.sender.name}.`
          }
        });

        // Trigger socket notification event for real-time notification badge
        ioInstance.to(`user_${receiverId}`).emit('notification', {
          type: 'NEW_MESSAGE',
          content: `You received a new message from ${message.sender.name}.`
        });

        if (callback) callback({ success: true, message });
      } catch (err) {
        logger.error('Error handling send_message socket event', { error: err.message });
        if (callback) callback({ error: 'Internal server error saving message.' });
      }
    });

    // Handle marking messages as read (read receipts)
    socket.on('read_receipt', async (payload, callback) => {
      try {
        const { senderId } = payload; // The user whose messages were read
        const recipientId = userId;  // The current logged-in user who read them

        if (!senderId) {
          if (callback) callback({ error: 'Sender ID is required.' });
          return;
        }

        // Update database: mark messages from senderId to recipientId as read
        await prisma.message.updateMany({
          where: {
            sender_id: senderId,
            receiver_id: recipientId,
            is_read: false
          },
          data: {
            is_read: true
          }
        });

        // Notify the original sender that their messages were read
        ioInstance.to(`user_${senderId}`).emit('messages_read', { readerId: recipientId });

        if (callback) callback({ success: true });
      } catch (err) {
        logger.error('Error handling read_receipt socket event', { error: err.message });
        if (callback) callback({ error: 'Internal server error updating read status.' });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id, userId });
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
