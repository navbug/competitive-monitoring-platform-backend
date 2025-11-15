require('dotenv').config();
const scraperService = require('../services/scraperService');

const testUrls = [
  {
    name: "Trello Pricing",
    url: "https://trello.com/pricing",
    type: "website"
  },
  {
    name: "Trello Blog RSS",
    url: "https://rss.app/feeds/rKLWCV73uLNb3cE8.xml",
    type: "rss"
  },
  {
    name: "Monday.com Pricing",
    url: "https://monday.com/pricing",
    type: "website"
  },
  {
    name: "Monday.com Blog RSS",
    url: "https://rss.app/feeds/Zh4l4dGZ8UKyhkSi.xml",
    type: "rss"
  },
  {
    name: "ClickUp Pricing",
    url: "https://clickup.com/pricing",
    type: "website"
  },
  {
    name: "ClickUp Blog RSS",
    url: "https://rss.app/feeds/WQtjKWMlbXGRd2f8.xml",
    type: "rss"
  },
  // {
  //   name: "Asana Pricing",
  //   url: "https://asana.com/pricing",
  //   type: "website"
  // },
  // {
  //   name: "Asana Blog RSS",
  //   url: "https://rss.app/feeds/WIzGRIIDusjM9f9O.xml",
  //   type: "rss"
  // },
];

async function testScraping() {
  console.log('🧪 Testing Project Management SaaS Scraping\n');
  console.log('=' .repeat(60));

  for (const test of testUrls) {
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Type: ${test.type}`);

    try {
      let result;
      
      if (test.type === 'website') {
        result = await scraperService.scrapeWebpage(test.url);
      } else {
        result = await scraperService.scrapeRSSFeed(test.url);
      }

      if (result.success) {
        console.log('   ✅ SUCCESS');
        
        if (test.type === 'website') {
          console.log(`   Title: ${result.data.title.substring(0, 50)}...`);
          console.log(`   Content Length: ${result.data.content.length} chars`);
          console.log(`   Has Pricing: ${result.data.hasPricing ? 'Yes' : 'No'}`);
          console.log(`   Links Found: ${result.data.links.length}`);
          console.log(`   Word Count: ${result.data.wordCount}`);
        } else {
          console.log(`   Feed Title: ${result.data.feedTitle}`);
          console.log(`   Items Found: ${result.data.items.length}`);
          if (result.data.items.length > 0) {
            console.log(`   Latest: ${result.data.items[0].title.substring(0, 50)}...`);
          }
        }
      } else {
        console.log('   ❌ FAILED');
        console.log(`   Error: ${result.error}`);
      }

      // Delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log('   ❌ ERROR');
      console.log(`   ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Testing completed!');
  console.log('\n💡 Tips:');
  console.log('   - If RSS feeds fail, check the URL in browser');
  console.log('   - If websites fail, they might have anti-scraping');
  console.log('   - Wait a few seconds between retries');
}

// Run the test
testScraping()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });