const express = require('express');
const router = express.Router();
const Competitor = require('../models/Competitor');
const Update = require('../models/Update');
const { protect } = require('../middleware/auth');
const { scraperQueue } = require('../config/queue');

// All routes are protected
router.use(protect);

// @route   GET /api/competitors
// @desc    Get all competitors
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query['monitoringConfig.priority'] = priority;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    const competitors = await Competitor.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: competitors.length,
      data: competitors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/competitors/:id
// @desc    Get single competitor
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const competitor = await Competitor.findById(req.params.id);

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found'
      });
    }

    // Get recent updates
    const recentUpdates = await Update.find({ competitor: req.params.id })
      .sort({ detectedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        competitor,
        recentUpdates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/competitors
// @desc    Create competitor
// @access  Private
router.post('/', async (req, res) => {
  try {
    const competitorData = {
      ...req.body,
      createdBy: req.user.id
    };

    const competitor = await Competitor.create(competitorData);

    res.status(201).json({
      success: true,
      data: competitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/competitors/:id
// @desc    Update competitor
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const competitor = await Competitor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found'
      });
    }

    res.json({
      success: true,
      data: competitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/competitors/:id
// @desc    Delete competitor
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const competitor = await Competitor.findByIdAndDelete(req.params.id);

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found'
      });
    }

    // Also delete related updates
    await Update.deleteMany({ competitor: req.params.id });

    res.json({
      success: true,
      message: 'Competitor and related updates deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/competitors/:id/stats
// @desc    Get competitor statistics
// @access  Private
router.get('/:id/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { competitor: req.params.id };
    
    if (startDate || endDate) {
      matchStage.detectedAt = {};
      if (startDate) matchStage.detectedAt.$gte = new Date(startDate);
      if (endDate) matchStage.detectedAt.$lte = new Date(endDate);
    }

    const stats = await Update.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 },
          avgImpact: { $avg: '$classification.aiConfidence' }
        }
      }
    ]);

    const totalUpdates = await Update.countDocuments(matchStage);

    res.json({
      success: true,
      data: {
        totalUpdates,
        byCategory: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/competitors/:id/scrape
// @desc    Manually trigger scraping for competitor
// @access  Private
router.post('/:id/scrape', async (req, res) => {
  try {
    const competitor = await Competitor.findById(req.params.id);

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found'
      });
    }

    let jobsQueued = 0;

    // Queue website pages
    if (competitor.monitoredChannels.websitePages) {
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
      }
    }

    // Queue RSS feeds
    if (competitor.monitoredChannels.rssFeeds) {
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
      }
    }

    res.json({
      success: true,
      message: `Scraping triggered for ${competitor.name}`,
      jobsQueued
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;