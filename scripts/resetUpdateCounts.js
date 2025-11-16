require('dotenv').config();
const mongoose = require('mongoose');
const Competitor = require('../models/Competitor');
const Update = require('../models/Update');

async function resetUpdateCounts() {
  try {
    console.log('🔄 Resetting update counts...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const competitors = await Competitor.find();
    
    console.log(`📊 Found ${competitors.length} competitors\n`);

    for (const competitor of competitors) {
      // Get actual count from database
      const actualCount = await Update.countDocuments({
        competitor: competitor._id
      });

      // Get old (wrong) count
      const oldCount = competitor.metrics?.totalUpdates || 0;

      // Update with correct count
      await Competitor.findByIdAndUpdate(competitor._id, {
        'metrics.totalUpdates': actualCount,
        'metrics.lastUpdateDetected': actualCount > 0 
          ? await Update.findOne({ competitor: competitor._id })
              .sort({ detectedAt: -1 })
              .then(u => u?.detectedAt)
          : null
      });

      console.log(`✅ ${competitor.name}`);
      console.log(`   Old count: ${oldCount}`);
      console.log(`   New count: ${actualCount}`);
      console.log(`   Difference: ${oldCount - actualCount} (removed)\n`);
    }

    console.log('=' .repeat(60));
    console.log('🎉 All update counts reset to correct values!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetUpdateCounts();