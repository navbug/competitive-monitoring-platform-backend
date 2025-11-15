require('dotenv').config();
const mongoose = require('mongoose');
const { scraperQueue } = require('../config/queue');
const Competitor = require('../models/Competitor');

async function triggerImmediateScrape() {
  console.log('🚀 Triggering immediate scrape for ALL competitors...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const competitors = await Competitor.find({ status: 'active' });
    
    if (competitors.length === 0) {
      console.log('⚠️  No active competitors found!');
      console.log('💡 Run: npm run seed');
      process.exit(0);
    }

    console.log(`📊 Found ${competitors.length} active competitors\n`);

    let totalJobs = 0;

    for (const competitor of competitors) {
      console.log(`\n📍 ${competitor.name}`);
      console.log(`   Frequency: ${competitor.monitoringConfig.frequency}`);
      console.log(`   Priority: ${competitor.monitoringConfig.priority}`);

      let jobsQueued = 0;

      // Queue website pages
      if (competitor.monitoredChannels.websitePages?.length > 0) {
        console.log(`   🌐 Queueing ${competitor.monitoredChannels.websitePages.length} website pages...`);
        
        for (const page of competitor.monitoredChannels.websitePages) {
          await scraperQueue.add({
            competitorId: competitor._id,
            url: page.url,
            type: 'website'
          }, {
            priority: 1, // High priority for manual trigger
            attempts: 3
          });
          jobsQueued++;
          console.log(`      ✓ ${page.url}`);
        }
      }

      // Queue RSS feeds
      if (competitor.monitoredChannels.rssFeeds?.length > 0) {
        console.log(`   📡 Queueing ${competitor.monitoredChannels.rssFeeds.length} RSS feeds...`);
        
        for (const feed of competitor.monitoredChannels.rssFeeds) {
          await scraperQueue.add({
            competitorId: competitor._id,
            url: feed.url,
            type: 'rss'
          }, {
            priority: 1,
            attempts: 3
          });
          jobsQueued++;
          console.log(`      ✓ ${feed.url}`);
        }
      }

      console.log(`   ✅ ${jobsQueued} jobs queued`);
      totalJobs += jobsQueued;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Successfully queued ${totalJobs} scraping jobs!`);
    console.log('\n📊 Monitor progress:');
    console.log('   - Check worker terminal for scraping logs');
    console.log('   - Updates will appear in dashboard within 1-2 minutes');
    console.log('   - RSS feeds are usually faster than websites');
    console.log('\n💡 Tip: Refresh your browser after 1-2 minutes\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the trigger
triggerImmediateScrape();