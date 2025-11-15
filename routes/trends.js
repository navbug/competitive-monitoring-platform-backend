const express = require('express');
const router = express.Router();
const Trend = require('../models/Trend');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/trends
// @desc    Get all trends
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, significance, category } = req.query;

    let query = {};
    if (status) query.status = status;
    if (significance) query.significance = significance;
    if (category) query.category = category;

    const trends = await Trend.find(query)
      .populate('affectedCompetitors', 'name website')
      .populate('relatedUpdates', 'title detectedAt classification')
      .sort({ 'timeframe.lastSeen': -1 });

    res.json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/trends/:id
// @desc    Get single trend
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const trend = await Trend.findById(req.params.id)
      .populate('affectedCompetitors', 'name website industry')
      .populate({
        path: 'relatedUpdates',
        populate: { path: 'competitor', select: 'name' }
      });

    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/trends/:id
// @desc    Update trend status
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const trend = await Trend.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/trends/:id
// @desc    Delete trend
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const trend = await Trend.findByIdAndDelete(req.params.id);

    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.json({
      success: true,
      message: 'Trend deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;