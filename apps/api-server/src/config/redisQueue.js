const { Queue } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Retrieve Redis connection URL securely from environment
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL environment variable is not defined.');
  throw new Error('REDIS_URL environment variable is not defined.');
}

// Initialize ioredis connection pool
// BullMQ requires maxRetriesPerRequest to be null
const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  reconnectOnError: (err) => {
    logger.error('Redis encountered connection error, attempting reconnection', { error: err.message });
    return true;
  }
});

redisConnection.on('connect', () => {
  logger.info('Successfully connected to Redis server for background workers.');
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection pool error', { error: err.message, stack: err.stack });
});

// Initialize three distinct BullMQ queues driven by the shared Redis connection
const aiReviewQueue = new Queue('aiReviewQueue', { connection: redisConnection });
const emailQueue = new Queue('emailQueue', { connection: redisConnection });
const pdfGenerationQueue = new Queue('pdfGenerationQueue', { connection: redisConnection });

logger.info('Successfully initialized BullMQ Queue instances: aiReviewQueue, emailQueue, pdfGenerationQueue.');

// Map queue names to their instances for easy dynamic access
const queues = {
  aiReviewQueue,
  emailQueue,
  pdfGenerationQueue,
};

/**
 * Utility function to add jobs to any of the background queues effortlessly.
 * 
 * @param {string} queueName - Name of the queue ('aiReviewQueue', 'emailQueue', 'pdfGenerationQueue')
 * @param {string} jobName - Name of the specific job to run
 * @param {Object} data - Payload data for the job
 * @param {Object} [options] - Optional BullMQ configurations (e.g. priority, delay, attempts)
 * @returns {Promise<Object>} The created BullMQ job instance
 */
async function addJob(queueName, jobName, data, options = {}) {
  const targetQueue = queues[queueName];
  if (!targetQueue) {
    logger.error('Attempted to add job to non-existent queue', { queueName, jobName });
    throw new Error(`Queue '${queueName}' is not defined. Active queues are: ${Object.keys(queues).join(', ')}`);
  }

  try {
    const job = await targetQueue.add(jobName, data, {
      removeOnComplete: true, // Auto clean completed jobs to conserve Redis memory
      removeOnFail: false,   // Retain failed jobs for debugging / analysis
      attempts: 3,           // Default retry count
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      ...options,
    });

    logger.info('Background job successfully enqueued', {
      queueName,
      jobId: job.id,
      jobName,
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue job to BullMQ queue', {
      queueName,
      jobName,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  aiReviewQueue,
  emailQueue,
  pdfGenerationQueue,
  addJob,
  redisConnection,
};
