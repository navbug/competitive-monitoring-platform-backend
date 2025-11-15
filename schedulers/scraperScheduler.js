const cron = require('node-cron');
const { scraperQueue } = require('../config/queue');
const Competitor = require('../models/Competitor');

function startScrapers() {
  console.log('⏰ Starting scraper schedulers...');

  // Website scraping - every 5 minutes (for testing)
  cron.schedule('*/5 * * * *', async () => {
    console.log('🕒 Running website scraper (5min interval)...');
    await runWebsiteScraper('5minutes');
  });

  // Website scraping - every 10 minutes (for testing)
  cron.schedule('*/10 * * * *', async () => {
    console.log('🕒 Running website scraper (10min interval)...');
    await runWebsiteScraper('10minutes');
  });

  // Website scraping - every 30 minutes (for testing)
  cron.schedule('*/30 * * * *', async () => {
    console.log('🕒 Running website scraper (30min interval)...');
    await runWebsiteScraper('30minutes');
  });

  // Website scraping - every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🕒 Running website scraper (hourly)...');
    await runWebsiteScraper('hourly');
  });

  // Website scraping - every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🕒 Running website scraper (6 hours)...');
    await runWebsiteScraper('6hours');
  });

  // Website scraping - every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('🕒 Running website scraper (12 hours)...');
    await runWebsiteScraper('12hours');
  });

  // Website scraping - daily
  cron.schedule('0 0 * * *', async () => {
    console.log('🕒 Running website scraper (daily)...');
    await runWebsiteScraper('daily');
  });

  // RSS feed scraping - every 5 minutes (for testing)
  cron.schedule('*/5 * * * *', async () => {
    console.log('🕒 Running RSS scraper (5min interval)...');
    await runRssScraper('5minutes');
  });

  // RSS feed scraping - every 10 minutes (for testing)
  cron.schedule('*/10 * * * *', async () => {
    console.log('🕒 Running RSS scraper (10min interval)...');
    await runRssScraper('10minutes');
  });

  // RSS feed scraping - every 30 minutes (for testing)
  cron.schedule('*/30 * * * *', async () => {
    console.log('🕒 Running RSS scraper (30min interval)...');
    await runRssScraper('30minutes');
  });

  // RSS feed scraping - every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🕒 Running RSS scraper (hourly)...');
    await runRssScraper('hourly');
  });

  console.log('✅ Schedulers started:');
  console.log('   📄 Websites: 5min, 10min, 30min, hourly, 6h, 12h, daily');
  console.log('   📡 RSS: 5min, 10min, 30min, hourly');
  console.log('   💡 Set competitor frequency to match desired interval');

  // Manual trigger function
  async function triggerManualScrape(competitorId) {
    try {
      const competitor = await Competitor.findById(competitorId);
      
      if (!competitor) {
        throw new Error('Competitor not found');
      }

      // Queue all monitoring channels
      const jobs = [];

      if (competitor.monitoredChannels.websitePages) {
        for (const page of competitor.monitoredChannels.websitePages) {
          jobs.push(scraperQueue.add({
            competitorId: competitor._id,
            url: page.url,
            type: 'website'
          }));
        }
      }

      if (competitor.monitoredChannels.rssFeeds) {
        for (const feed of competitor.monitoredChannels.rssFeeds) {
          jobs.push(scraperQueue.add({
            competitorId: competitor._id,
            url: feed.url,
            type: 'rss'
          }));
        }
      }

      await Promise.all(jobs);
      console.log(`✅ Manual scrape triggered for ${competitor.name}`);

      return { success: true, jobsQueued: jobs.length };

    } catch (error) {
      console.error('Manual scrape error:', error);
      return { success: false, error: error.message };
    }
  }

  return { triggerManualScrape };
}

// Helper function to run website scraping for specific frequency
async function runWebsiteScraper(frequency) {
  try {
    const competitors = await Competitor.find({
      status: 'active',
      'monitoringConfig.enabled': true,
      'monitoringConfig.frequency': frequency
    });

    for (const competitor of competitors) {
      // Queue website page scraping
      if (competitor.monitoredChannels.websitePages) {
        for (const page of competitor.monitoredChannels.websitePages) {
          await scraperQueue.add({
            competitorId: competitor._id,
            url: page.url,
            type: 'website'
          }, {
            priority: competitor.monitoringConfig.priority === 'high' ? 1 : 
                     competitor.monitoringConfig.priority === 'medium' ? 2 : 3,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 10000
            }
          });
        }
      }
    }

    if (competitors.length > 0) {
      console.log(`✅ Queued website scraping for ${competitors.length} competitors (${frequency})`);
    }

  } catch (error) {
    console.error(`Website scraper scheduler error (${frequency}):`, error);
  }
}

// Helper function to run RSS scraping for specific frequency
async function runRssScraper(frequency) {
  try {
    const competitors = await Competitor.find({
      status: 'active',
      'monitoringConfig.enabled': true,
      'monitoringConfig.frequency': frequency,
      'monitoredChannels.rssFeeds.0': { $exists: true }
    });

    for (const competitor of competitors) {
      if (competitor.monitoredChannels.rssFeeds) {
        for (const feed of competitor.monitoredChannels.rssFeeds) {
          await scraperQueue.add({
            competitorId: competitor._id,
            url: feed.url,
            type: 'rss'
          }, {
            priority: 1, // RSS is lightweight, give higher priority
            attempts: 3
          });
        }
      }
    }

    if (competitors.length > 0) {
      console.log(`✅ Queued RSS scraping for ${competitors.length} competitors (${frequency})`);
    }

  } catch (error) {
    console.error(`RSS scraper scheduler error (${frequency}):`, error);
  }
}

module.exports = { startScrapers };