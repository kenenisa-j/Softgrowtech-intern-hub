const { Queue } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Retrieve Redis connection URL securely from environment, default to localhost
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Check if Redis is running synchronously using a child process
const { execSync } = require('child_process');
let redisAvailable = false;
try {
  const checkScript = `
    const Redis = require('ioredis');
    const redis = new Redis('${redisUrl}', { maxRetriesPerRequest: 1, connectTimeout: 1000 });
    redis.ping()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  `;
  execSync(`node -e "${checkScript.replace(/\n/g, ' ')}"`, { stdio: 'ignore', timeout: 1500 });
  redisAvailable = true;
} catch (e) {
  redisAvailable = false;
}

const mockWorkers = {};
function registerMockWorker(name, processor) {
  mockWorkers[name] = processor;
}

class MockQueue {
  constructor(name) {
    this.name = name;
  }
  async add(jobName, data, options = {}) {
    logger.info({ msg: `[Mock Queue: ${this.name}] Enqueued job "${jobName}"`, jobName, data });
    setImmediate(async () => {
      try {
        const processor = mockWorkers[this.name];
        if (processor) {
          logger.info({ msg: `[Mock Queue: ${this.name}] Starting worker for job "${jobName}"`, jobName });
          await processor({ data, id: `mock-job-${Date.now()}` });
          logger.info({ msg: `[Mock Queue: ${this.name}] Worker successfully completed job "${jobName}"`, jobName });
        } else {
          logger.warn({ msg: `[Mock Queue: ${this.name}] No worker registered for queue`, jobName });
        }
      } catch (err) {
        logger.error({ msg: `[Mock Queue: ${this.name}] Job "${jobName}" failed`, jobName, error: err.message });
      }
    });
    return { id: `mock-job-${Date.now()}` };
  }
}

let aiReviewQueue;
let emailQueue;
let pdfGenerationQueue;
let redisConnection;

if (redisAvailable) {
  logger.info('Redis server is available. Initializing real BullMQ queues.');
  redisConnection = new Redis(redisUrl, {
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

  aiReviewQueue = new Queue('aiReviewQueue', { connection: redisConnection });
  emailQueue = new Queue('emailQueue', { connection: redisConnection });
  pdfGenerationQueue = new Queue('pdfGenerationQueue', { connection: redisConnection });
} else {
  logger.warn('⚠️ Redis is NOT running. Using in-memory background worker queue simulation for development.');
  aiReviewQueue = new MockQueue('aiReviewQueue');
  emailQueue = new MockQueue('emailQueue');
  pdfGenerationQueue = new MockQueue('pdfGenerationQueue');
}

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
  redisAvailable,
  registerMockWorker,
};
