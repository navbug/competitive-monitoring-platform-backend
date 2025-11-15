const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const rssParser = new Parser();

class ScraperService {

  async scrapeWebpage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, and unnecessary elements
      $('script, style, nav, footer, header').remove();

      // Extract main content
      const title = $('title').text() || 
                    $('h1').first().text() || 
                    'No title found';
      
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         '';

      // Try to find main content
      const mainContent = $('main, article, .content, #content').first().text() ||
                         $('body').text();

      // Clean up text
      const cleanText = mainContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);

      // Check for pricing indicators
      const hasPricing = response.data.toLowerCase().includes('$') ||
                        response.data.toLowerCase().includes('price') ||
                        response.data.toLowerCase().includes('pricing');

      // Extract links
      const links = [];
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && (href.startsWith('http') || href.startsWith('/'))) {
          links.push(href);
        }
      });

      return {
        success: true,
        data: {
          url,
          title: title.trim(),
          description: description.trim(),
          content: cleanText,
          hasPricing,
          links: links.slice(0, 50),
          scrapedAt: new Date(),
          wordCount: cleanText.split(' ').length
        }
      };

    } catch (error) {
      console.error(`Scraping error for ${url}:`, error.message);
      return {
        success: false,
        error: error.message,
        url
      };
    }
  }

  async scrapeRSSFeed(feedUrl) {
    try {
      const feed = await rssParser.parseURL(feedUrl);
      
      const items = feed.items.map(item => ({
        title: item.title,
        link: item.link,
        content: item.contentSnippet || item.content || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        categories: item.categories || []
      }));

      return {
        success: true,
        data: {
          feedTitle: feed.title,
          items: items.slice(0, 10), // Get latest 10 items
          scrapedAt: new Date()
        }
      };

    } catch (error) {
      console.error(`RSS parsing error for ${feedUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
        feedUrl
      };
    }
  }

  async checkForChanges(currentContent, previousContent) {
    if (!previousContent) return true;

    // Simple change detection
    const similarity = this.calculateSimilarity(currentContent, previousContent);
    
    // If less than 90% similar, consider it changed
    return similarity < 0.9;
  }

  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  extractPricingInfo(content) {
    // Simple pricing extraction
    const priceRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const prices = content.match(priceRegex) || [];
    
    return {
      hasPricing: prices.length > 0,
      prices: prices.slice(0, 10)
    };
  }

  async detectContentType(url, content) {
    const lowerUrl = url.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (lowerUrl.includes('pricing') || lowerUrl.includes('price')) {
      return 'pricing';
    } else if (lowerUrl.includes('blog') || lowerUrl.includes('news')) {
      return 'blog_post';
    } else if (lowerUrl.includes('product') || lowerUrl.includes('feature')) {
      return 'product';
    } else if (lowerUrl.includes('about') || lowerUrl.includes('company')) {
      return 'about';
    } else if (lowerUrl.includes('career') || lowerUrl.includes('job')) {
      return 'hiring';
    }

    return 'other';
  }

  // Rate limiting helper
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ScraperService();