const { PrismaClient } = require('@prisma/client');

// Initialize PrismaClient with logging configured based on environment
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
