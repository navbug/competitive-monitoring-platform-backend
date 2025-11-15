require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth');
const competitorRoutes = require('./routes/competitors');
const updateRoutes = require('./routes/updates');
const trendRoutes = require('./routes/trends');
const notificationRoutes = require('./routes/notifications');

// Import schedulers
const { startScrapers } = require('./schedulers/scraperScheduler');
const { startTrendAnalysis } = require('./schedulers/trendScheduler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    // Start schedulers after DB connection
    startScrapers();
    startTrendAnalysis();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Competitor Monitoring API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;