const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Competitor name is required'],
    trim: true,
    unique: true
  },
  website: {
    type: String,
    required: [true, 'Website URL is required'],
    trim: true
  },
  industry: {
    type: String,
    default: 'Project Management SaaS',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Project Management specific features
  keyFeatures: [String],
  targetMarket: {
    type: String,
    enum: ['small-business', 'enterprise', 'teams', 'freelancers', 'all'],
    default: 'all'
  },
  pricingModel: {
    type: String,
    enum: ['freemium', 'subscription', 'per-user', 'flat-rate', 'tiered'],
    default: 'tiered'
  },
  monitoredChannels: {
    websitePages: [{
      url: String,
      type: { type: String, enum: ['pricing', 'product', 'blog', 'about', 'careers'] },
      lastChecked: Date
    }],
    socialMedia: [{
      platform: { type: String, enum: ['twitter', 'linkedin', 'facebook', 'instagram'] },
      handle: String,
      lastChecked: Date
    }],
    rssFeeds: [{
      url: String,
      lastChecked: Date
    }]
  },
  monitoringConfig: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['5minutes', '10minutes', '30minutes', 'hourly', '6hours', '12hours', 'daily'],
      default: '6hours'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  },
  metrics: {
    totalUpdates: { type: Number, default: 0 },
    lastUpdateDetected: Date,
    lastSuccessfulScrape: Date,
    failedScrapeCount: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
competitorSchema.index({ name: 1 });
competitorSchema.index({ status: 1 });
competitorSchema.index({ 'monitoringConfig.enabled': 1 });

module.exports = mongoose.model('Competitor', competitorSchema);