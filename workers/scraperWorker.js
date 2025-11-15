const { scraperQueue, classificationQueue } = require('../config/queue');
const scraperService = require('../services/scraperService');
const Competitor = require('../models/Competitor');
const Update = require('../models/Update');

// Process scraper jobs
scraperQueue.process(async (job) => {
  const { competitorId, url, type } = job.data;

  console.log(`🔍 Scraping ${type} for competitor ${competitorId}: ${url}`);

  try {
    let result;

    if (type === 'rss') {
      result = await scraperService.scrapeRSSFeed(url);
      
      if (result.success) {
        // Process each RSS item
        for (const item of result.data.items) {
          // Check if this update already exists
          const existing = await Update.findOne({
            competitor: competitorId,
            'source.url': item.link
          });

          if (!existing) {
            // Create new update
            const update = await Update.create({
              competitor: competitorId,
              title: item.title,
              content: item.content,
              source: {
                type: 'rss',
                url: item.link
              },
              detectedAt: item.pubDate,
              rawData: item,
              metadata: {
                wordCount: item.content.split(' ').length
              }
            });

            // Queue for AI classification
            await classificationQueue.add({
              updateId: update._id,
              title: update.title,
              content: update.content,
              competitorId
            }, {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000
              }
            });
          }
        }

        // Update competitor metrics
        await Competitor.findByIdAndUpdate(competitorId, {
          'monitoredChannels.rssFeeds.$[elem].lastChecked': new Date(),
          'metrics.lastSuccessfulScrape': new Date(),
          $inc: { 'metrics.totalUpdates': result.data.items.length }
        }, {
          arrayFilters: [{ 'elem.url': url }]
        });
      }

    } else if (type === 'website') {
      result = await scraperService.scrapeWebpage(url);

      if (result.success) {
        // Check if content changed significantly
        const lastUpdate = await Update.findOne({
          competitor: competitorId,
          'source.url': url
        }).sort({ detectedAt: -1 });

        const hasChanges = await scraperService.checkForChanges(
          result.data.content,
          lastUpdate ? lastUpdate.content : null
        );

        if (hasChanges) {
          // Create new update
          const update = await Update.create({
            competitor: competitorId,
            title: result.data.title,
            content: result.data.content,
            source: {
              type: 'website',
              url: result.data.url
            },
            detectedAt: new Date(),
            rawData: result.data,
            metadata: {
              wordCount: result.data.wordCount,
              hasPricing: result.data.hasPricing,
              urls: result.data.links
            }
          });

          // Queue for AI classification
          await classificationQueue.add({
            updateId: update._id,
            title: update.title,
            content: update.content,
            competitorId
          });
        }

        // Update competitor metrics
        await Competitor.findByIdAndUpdate(competitorId, {
          'monitoredChannels.websitePages.$[elem].lastChecked': new Date(),
          'metrics.lastSuccessfulScrape': new Date()
        }, {
          arrayFilters: [{ 'elem.url': url }]
        });
      }
    }

    // Add delay to be respectful
    await scraperService.delay(2000);

    return { success: true, result };

  } catch (error) {
    console.error('Scraper worker error:', error);
    
    // Update fail count
    await Competitor.findByIdAndUpdate(competitorId, {
      $inc: { 'metrics.failedScrapeCount': 1 }
    });

    throw error;
  }
});

console.log('👷 Scraper worker started');

module.exports = scraperQueue;