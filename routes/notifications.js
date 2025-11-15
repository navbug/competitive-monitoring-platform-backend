const express = require('express');
const router = express.Router();
const Update = require('../models/Update');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications (high-impact updates)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { read, limit = 20 } = req.query;

    // Get user's impact threshold
    const impactThreshold = req.user.preferences.notificationSettings.impactThreshold;

    const impactLevels = {
      'low': ['low', 'medium', 'high', 'critical'],
      'medium': ['medium', 'high', 'critical'],
      'high': ['high', 'critical'],
      'critical': ['critical']
    };

    let query = {
      'classification.impactLevel': { 
        $in: impactLevels[impactThreshold] 
      }
    };

    if (read === 'false') {
      query.status = 'new';
    }

    const notifications = await Update.find(query)
      .populate('competitor', 'name website')
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Update.countDocuments({
      'classification.impactLevel': { $in: impactLevels[impactThreshold] },
      status: 'new'
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const update = await Update.findByIdAndUpdate(
      req.params.id,
      { status: 'reviewed' },
      { new: true }
    );

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
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

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', async (req, res) => {
  try {
    await Update.updateMany(
      { status: 'new' },
      { status: 'reviewed' }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;