require('dotenv').config();
const mongoose = require('mongoose');

// Import workers
require('./workers/scraperWorker');
require('./workers/classificationWorker');

console.log('🚀 Starting workers...');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log('👷 Workers are now processing jobs');
    console.log('📊 Scraper Worker: Processing scraping jobs');
    console.log('🤖 Classification Worker: Processing AI classification jobs');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down workers...');
  mongoose.connection.close(() => {
    console.log('✅ Workers shut down gracefully');
    process.exit(0);
  });
});