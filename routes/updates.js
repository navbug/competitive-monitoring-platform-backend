const express = require('express');
const router = express.Router();
const Update = require('../models/Update');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/updates
// @desc    Get all updates with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      competitor, 
      category, 
      impactLevel, 
      status,
      startDate,
      endDate,
      limit = 50,
      page = 1
    } = req.query;

    let query = {};

    if (competitor) query.competitor = competitor;
    if (category) query['classification.category'] = category;
    if (impactLevel) query['classification.impactLevel'] = impactLevel;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.detectedAt = {};
      if (startDate) query.detectedAt.$gte = new Date(startDate);
      if (endDate) query.detectedAt.$lte = new Date(endDate);
    }

    const updates = await Update.find(query)
      .populate('competitor', 'name website')
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Update.countDocuments(query);

    res.json({
      success: true,
      count: updates.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: updates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/updates/:id
// @desc    Get single update
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const update = await Update.findById(req.params.id)
      .populate('competitor', 'name website industry')
      .populate('trendId');

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/updates/:id/status
// @desc    Update status
// @access  Private
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const update = await Update.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/updates/stats/overview
// @desc    Get updates statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate || endDate) {
      matchStage.detectedAt = {};
      if (startDate) matchStage.detectedAt.$gte = new Date(startDate);
      if (endDate) matchStage.detectedAt.$lte = new Date(endDate);
    }

    const stats = await Update.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: {
              category: '$classification.category',
              impact: '$classification.impactLevel'
            }
          }
        }
      }
    ]);

    const byImpact = await Update.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$classification.impactLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const timeline = await Update.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        byImpact,
        timeline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/updates/:id
// @desc    Delete update
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const update = await Update.findByIdAndDelete(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    res.json({
      success: true,
      message: 'Update deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;