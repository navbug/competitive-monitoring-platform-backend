const { classificationQueue, notificationQueue } = require('../config/queue');
const geminiService = require('../services/geminiService');
const Update = require('../models/Update');
const Competitor = require('../models/Competitor');

// Process classification jobs
classificationQueue.process(async (job) => {
  const { updateId, title, content, competitorId } = job.data;

  console.log(`🤖 Classifying update ${updateId}`);

  try {
    // Get competitor name
    const competitor = await Competitor.findById(competitorId);
    
    // Classify using Gemini
    const result = await geminiService.classifyUpdate(
      title,
      content,
      competitor.name
    );

    const classification = result.data;

    // Update the update document
    await Update.findByIdAndUpdate(updateId, {
      classification: {
        category: classification.category,
        impactLevel: classification.impactLevel,
        tags: classification.tags,
        aiConfidence: classification.confidence || 0.5,
        classifiedBy: result.success ? 'ai' : 'rules'
      },
      summary: classification.summary,
      sentiment: classification.sentiment,
      'metadata.hasPricing': classification.hasPricing
    });

    // If high or critical impact, queue notification
    if (classification.impactLevel === 'high' || classification.impactLevel === 'critical') {
      await notificationQueue.add({
        updateId,
        competitorId,
        impactLevel: classification.impactLevel,
        category: classification.category
      });
    }

    // Update competitor metrics
    await Competitor.findByIdAndUpdate(competitorId, {
      'metrics.lastUpdateDetected': new Date()
    });

    return { success: true, classification };

  } catch (error) {
    console.error('Classification worker error:', error);
    throw error;
  }
});

console.log('👷 Classification worker started');

module.exports = classificationQueue;