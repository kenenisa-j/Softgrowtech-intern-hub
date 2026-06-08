// utils/socketTest.js
// Simple helper to verify the socket.io connection from the web client.
// It expects a JWT token string (usually from your auth context) and returns the connected socket.

import { io } from 'socket.io-client';

/**
 * Initialise a socket.io client with JWT auth.
 * @param {string} token - JWT token for the current user/tenant.
 * @param {string} [baseUrl] - Optional base URL of the socket server. Defaults to the same origin.
 * @returns {ReturnType<io>} Connected socket instance.
 */
export function initSocket(token, baseUrl = window.location.origin) {
  const socket = io(baseUrl, {
    // Socket.io v4 auth option – will be sent in the initial handshake
    auth: {
      token,
    },
    // Optional: enforce only websocket transport for test simplicity
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.info('🔌 Socket connected – id:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err);
  });

  // Example listener for a generic server‑side event (e.g., attendance updates)
  socket.on('attendance:update', (payload) => {
    console.log('📊 Attendance update received:', payload);
  });

  return socket;
}

// Usage example (remove or adapt in production):
// const token = localStorage.getItem('jwt');
// const socket = initSocket(token);
// // later you can emit or listen to events
// socket.emit('ping', { ts: Date.now() });
