// apps/api-server/src/prisma/client.js
// Centralized PrismaClient singleton

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'info'] : ['error'],
});

module.exports = prisma;
