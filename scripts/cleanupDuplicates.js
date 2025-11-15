require('dotenv').config();
const mongoose = require('mongoose');
const Update = require('../models/Update');

async function cleanupDuplicates() {
  try {
    console.log('🧹 Starting duplicate cleanup...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find duplicates by title + competitor
    const duplicates = await Update.aggregate([
      {
        $group: {
          _id: {
            competitor: '$competitor',
            title: '$title'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          dates: { $push: '$detectedAt' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`📊 Found ${duplicates.length} sets of duplicates\n`);

    let totalDeleted = 0;

    for (const dup of duplicates) {
      // Keep the oldest one, delete the rest
      const sortedIds = dup.ids.map((id, index) => ({
        id,
        date: dup.dates[index]
      })).sort((a, b) => a.date - b.date);

      const idsToDelete = sortedIds.slice(1).map(item => item.id);

      console.log(`🔍 Duplicate: "${dup._id.title.substring(0, 50)}..."`);
      console.log(`   Count: ${dup.count} copies`);
      console.log(`   Keeping: ${sortedIds[0].id} (${sortedIds[0].date})`);
      console.log(`   Deleting: ${idsToDelete.length} duplicates`);

      // Delete duplicates
      const result = await Update.deleteMany({
        _id: { $in: idsToDelete }
      });

      totalDeleted += result.deletedCount;
      console.log(`   ✅ Deleted ${result.deletedCount} duplicates\n`);
    }

    console.log('=' .repeat(60));
    console.log(`🎉 Cleanup complete!`);
    console.log(`📊 Total duplicates deleted: ${totalDeleted}`);
    console.log(`📊 Remaining updates: ${await Update.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

cleanupDuplicates();