const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  competitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competitor',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  source: {
    type: { type: String, enum: ['website', 'rss', 'social', 'manual'] },
    url: String,
    platform: String
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  classification: {
    category: {
      type: String,
      enum: ['pricing', 'feature_release', 'integration', 'blog_post', 'case_study', 'webinar', 'product_update', 'other'],
      default: 'other'
    },
    impactLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    tags: [String],
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1
    },
    classifiedBy: {
      type: String,
      enum: ['ai', 'rules', 'manual'],
      default: 'rules'
    }
  },
  summary: {
    type: String,
    trim: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  rawData: mongoose.Schema.Types.Mixed,
  trendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trend'
  },
  metadata: {
    wordCount: Number,
    hasImages: Boolean,
    hasPricing: Boolean,
    urls: [String]
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'archived'],
    default: 'new'
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
updateSchema.index({ competitor: 1, detectedAt: -1 });
updateSchema.index({ 'classification.category': 1 });
updateSchema.index({ 'classification.impactLevel': 1 });
updateSchema.index({ detectedAt: -1 });
updateSchema.index({ status: 1 });

module.exports = mongoose.model('Update', updateSchema);