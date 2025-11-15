const cron = require('node-cron');
const geminiService = require('../services/geminiService');
const Update = require('../models/Update');
const Trend = require('../models/Trend');
const Competitor = require('../models/Competitor');

function startTrendAnalysis() {
  console.log('⏰ Starting trend analysis scheduler...');

  // Run trend analysis every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('📊 Running trend analysis...');
    
    try {
      // Get recent updates (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUpdates = await Update.find({
        detectedAt: { $gte: sevenDaysAgo },
        status: 'new'
      })
      .populate('competitor', 'name')
      .sort({ detectedAt: -1 })
      .limit(50);

      if (recentUpdates.length < 3) {
        console.log('⚠️  Not enough updates for trend analysis');
        return;
      }

      // Group by category
      const categorizedUpdates = {};
      recentUpdates.forEach(update => {
        const category = update.classification.category;
        if (!categorizedUpdates[category]) {
          categorizedUpdates[category] = [];
        }
        categorizedUpdates[category].push(update);
      });

      // Analyze each category
      for (const [category, updates] of Object.entries(categorizedUpdates)) {
        if (updates.length >= 3) {
          // Use AI to detect trends
          const trendAnalysis = await geminiService.analyzeTrends(updates);
          
          if (trendAnalysis.success && trendAnalysis.data.trends.length > 0) {
            for (const trendData of trendAnalysis.data.trends) {
              // Check if similar trend already exists
              const existingTrend = await Trend.findOne({
                pattern: { $regex: trendData.pattern, $options: 'i' },
                status: { $in: ['emerging', 'active'] }
              });

              if (existingTrend) {
                // Update existing trend
                await Trend.findByIdAndUpdate(existingTrend._id, {
                  'timeframe.lastSeen': new Date(),
                  $inc: { 'frequency.count': 1 },
                  $addToSet: {
                    relatedUpdates: { $each: updates.map(u => u._id) }
                  },
                  insights: trendData.insights,
                  status: 'active'
                });
              } else {
                // Create new trend
                const competitorIds = updates.map(u => u.competitor._id);
                
                await Trend.create({
                  pattern: trendData.pattern,
                  description: trendData.insights,
                  affectedCompetitors: [...new Set(competitorIds)],
                  relatedUpdates: updates.map(u => u._id),
                  category,
                  timeframe: {
                    firstSeen: new Date(),
                    lastSeen: new Date()
                  },
                  frequency: {
                    count: updates.length,
                    interval: 'weekly'
                  },
                  significance: trendData.significance,
                  insights: trendData.insights,
                  status: 'emerging'
                });
              }
            }
          }
        }
      }

      // Archive old trends (inactive for 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await Trend.updateMany({
        'timeframe.lastSeen': { $lt: thirtyDaysAgo },
        status: { $ne: 'archived' }
      }, {
        status: 'archived'
      });

      console.log('✅ Trend analysis completed');

    } catch (error) {
      console.error('Trend analysis error:', error);
    }
  });

  // Pattern detection (simple, no AI) - runs hourly
  cron.schedule('0 * * * *', async () => {
    console.log('🔍 Running pattern detection...');
    
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Detect if multiple competitors doing the same thing
      const recentUpdates = await Update.aggregate([
        {
          $match: {
            detectedAt: { $gte: oneDayAgo }
          }
        },
        {
          $group: {
            _id: '$classification.category',
            count: { $sum: 1 },
            competitors: { $addToSet: '$competitor' },
            updates: { $push: '$_id' }
          }
        },
        {
          $match: {
            count: { $gte: 3 }
          }
        }
      ]);

      for (const pattern of recentUpdates) {
        if (pattern.competitors.length >= 2) {
          const existingTrend = await Trend.findOne({
            category: pattern._id,
            status: { $in: ['emerging', 'active'] }
          });

          if (!existingTrend) {
            await Trend.create({
              pattern: `Multiple competitors active in ${pattern._id}`,
              affectedCompetitors: pattern.competitors,
              relatedUpdates: pattern.updates.slice(0, 10),
              category: pattern._id,
              timeframe: {
                firstSeen: oneDayAgo,
                lastSeen: new Date()
              },
              frequency: {
                count: pattern.count
              },
              significance: pattern.competitors.length >= 3 ? 'high' : 'medium',
              status: 'emerging'
            });
          }
        }
      }

      console.log('✅ Pattern detection completed');

    } catch (error) {
      console.error('Pattern detection error:', error);
    }
  });
}

module.exports = { startTrendAnalysis };