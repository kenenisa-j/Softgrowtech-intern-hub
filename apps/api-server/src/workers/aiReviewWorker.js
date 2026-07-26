// src/workers/aiReviewWorker.js
// BullMQ worker for AI review sandbox (free implementation)

const { Worker, Queue } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../utils/logger');
const prisma = require('../prisma/client'); // adjust path if needed
const { redisAvailable, registerMockWorker } = require('../config/redisQueue');

// Queue name
const AI_REVIEW_QUEUE = 'aiReviewQueue';

// Helper to simulate latency
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sandbox AI review generator – returns a score and feedback
function generateReview() {
  const score = Math.floor(Math.random() * (98 - 75 + 1)) + 75; // 75‑98
  const feedback = `Technical review completed. The submission demonstrates solid understanding of the assignment criteria. Score: ${score}.`; // simple static template
  return { score, feedback };
}

// Worker processor logic
const processor = async (job) => {
  const { submissionId, tenantId, assignmentCode, criteria } = job.data;
  logger.info({ msg: 'Processing AI review job', submissionId, tenantId });

  // AI credits are unlimited under the free version
  logger.info({ msg: 'Skipping credit check - unlimited free version', tenantId });

  // 2️⃣ Simulate network latency
  await wait(3000);

  // 3️⃣ Generate review payload
  const { score, feedback } = generateReview();

  // 4️⃣ Perform DB transaction
  const promptTokens = 350; // example static values
  const completionTokens = 50;
  const cost = 0.0015; // USD

  await prisma.$transaction(async (tx) => {
    // Update submission (assumes a Submission model exists)
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: 'reviewed',
        score,
        feedback,
      },
    });

    // Record AI usage
    await tx.aiUsageLedger.create({
      data: {
        tenant_id: tenantId,
        feature_key: 'ai_review',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        calculated_cost: cost,
      },
    });

    // Increment tenant consumed credits
    await tx.tenantCredits.update({
      where: { tenant_id: tenantId },
      data: {
        credits_consumed: {
          increment: cost,
        },
      },
    });
  });

  logger.info({ msg: 'AI review completed', submissionId, score });
  return { score, feedback };
};

let aiReviewWorker;
let redisConnection;

if (redisAvailable) {
  redisConnection = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    maxRetriesPerRequest: null,
  });

  redisConnection.on('error', (err) => {
    logger.error('Redis worker connection error (AI Review)', { error: err.message });
  });

  aiReviewWorker = new Worker(AI_REVIEW_QUEUE, processor, {
    connection: redisConnection,
    concurrency: 5
  });

  aiReviewWorker.on('completed', (job, result) => {
    logger.info({ msg: 'Job completed', jobId: job.id, result });
  });

  aiReviewWorker.on('failed', (job, err) => {
    logger.error({ msg: 'Job failed', jobId: job?.id, error: err?.message });
  });

  process.on('SIGINT', async () => {
    await aiReviewWorker.close();
    redisConnection.disconnect();
    process.exit(0);
  });
} else {
  registerMockWorker(AI_REVIEW_QUEUE, processor);
  aiReviewWorker = {
    close: async () => {
      logger.info('Mock AI Review worker closed.');
    }
  };
}

module.exports = { aiReviewWorker, AI_REVIEW_QUEUE };
