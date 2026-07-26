// scratch/enqueueTestAiReview.js
// Simple script to enqueue a test AI review job
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redis = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  maxRetriesPerRequest: null,
});

const aiReviewQueue = new Queue('aiReviewQueue', { connection: redis });

(async () => {
  const job = await aiReviewQueue.add('test-review', {
    submissionId: 'test-submission-id',
    tenantId: 'test-tenant-id',
    assignmentCode: 'ASSIGN001',
    criteria: {},
  });
  console.log('Enqueued job', job.id);
  await redis.disconnect();
})();
