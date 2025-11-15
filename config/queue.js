const Queue = require('bull');
const Redis = require('ioredis');

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Create queues
const scraperQueue = new Queue('scraper', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  limiter: {
    max: 5, // Max 5 jobs
    duration: 60000 // per 60 seconds
  }
});

const classificationQueue = new Queue('classification', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  limiter: {
    max: 15, // Max 15 per minute (Gemini free tier limit)
    duration: 60000
  }
});

const notificationQueue = new Queue('notification', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379'
});

const trendQueue = new Queue('trend-analysis', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Queue event handlers
scraperQueue.on('completed', (job) => {
  console.log(`✅ Scraper job ${job.id} completed`);
});

scraperQueue.on('failed', (job, err) => {
  console.error(`❌ Scraper job ${job.id} failed:`, err.message);
});

classificationQueue.on('completed', (job) => {
  console.log(`✅ Classification job ${job.id} completed`);
});

classificationQueue.on('failed', (job, err) => {
  console.error(`❌ Classification job ${job.id} failed:`, err.message);
});

module.exports = {
  scraperQueue,
  classificationQueue,
  notificationQueue,
  trendQueue,
  redisClient
};