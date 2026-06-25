const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
require('dotenv').config();

async function verify() {
  console.log('--- Auditing Infrastructure Status ---');
  
  // 1. MySQL Validation via Prisma
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ MySQL Connectivity: HEALTHY (Prisma Handshake OK)');
  } catch (err) {
    console.error('❌ MySQL Connectivity: FAILED', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Redis Validation
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log(`Testing Redis connection at: ${redisUrl}`);
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
  try {
    await redis.ping();
    console.log('✅ Redis Cache Connectivity: HEALTHY (Ping Received)');
  } catch (err) {
    console.error('❌ Redis Cache Connectivity: FAILED', err.message);
  } finally {
    redis.disconnect();
  }
}

verify();
