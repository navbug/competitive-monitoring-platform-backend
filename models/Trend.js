const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
  pattern: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  affectedCompetitors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competitor'
  }],
  relatedUpdates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Update'
  }],
  category: {
    type: String,
    enum: ['pricing', 'feature_release', 'integration', 'product_update', 'market_trend', 'other'],
    default: 'other'
  },
  timeframe: {
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true }
  },
  frequency: {
    count: { type: Number, default: 1 },
    interval: String // e.g., "weekly", "monthly"
  },
  significance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  insights: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['emerging', 'active', 'declining', 'archived'],
    default: 'emerging'
  },
  metadata: {
    keywords: [String],
    similarityScore: Number
  }
}, {
  timestamps: true
});

// Indexes
trendSchema.index({ 'timeframe.lastSeen': -1 });
trendSchema.index({ status: 1 });
trendSchema.index({ significance: 1 });

module.exports = mongoose.model('Trend', trendSchema);