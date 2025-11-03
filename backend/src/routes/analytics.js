import express from 'express';
import Analytics from '../models/Analytics.js';

const router = express.Router();

/**
 * GET /api/v1/analytics/summary
 * Get overall analytics summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all events in time range
    const events = await Analytics.findAll({
      where: {
        timestamp: {
          [Analytics.sequelize.Sequelize.Op.gte]: startDate
        }
      }
    });

    // Calculate statistics
    const total = events.length;
    const byType = {};
    const successCount = events.filter(e => e.success).length;
    const vagueErrors = events.filter(e => e.eventType === 'vague_error').length;
    const avgResponseTime = events
      .filter(e => e.responseTime)
      .reduce((sum, e) => sum + e.responseTime, 0) / (events.filter(e => e.responseTime).length || 1);

    events.forEach(e => {
      byType[e.eventType] = (byType[e.eventType] || 0) + 1;
    });

    res.json({
      summary: {
        total,
        days: parseInt(days),
        successRate: total > 0 ? ((successCount / total) * 100).toFixed(2) + '%' : '0%',
        vagueErrorRate: total > 0 ? ((vagueErrors / total) * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: Math.round(avgResponseTime) + 'ms'
      },
      byType,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics summary' });
  }
});

/**
 * GET /api/v1/analytics/vague-errors
 * Get vague error statistics
 */
router.get('/vague-errors', async (req, res) => {
  try {
    const stats = await Analytics.getVagueErrorStats();

    // Get example prompts for each error type
    const examples = {};
    for (const stat of stats) {
      const example = await Analytics.findOne({
        where: { errorType: stat.errorType },
        attributes: ['userPrompt', 'suggestionsOffered'],
        order: [['timestamp', 'DESC']]
      });
      examples[stat.errorType] = {
        prompt: example?.userPrompt,
        suggestions: example?.suggestionsOffered
      };
    }

    res.json({
      stats,
      examples
    });
  } catch (error) {
    console.error('Vague errors analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve vague error stats' });
  }
});

/**
 * GET /api/v1/analytics/common-terms
 * Get most common terms in user prompts
 */
router.get('/common-terms', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const terms = await Analytics.getMostCommonTerms(parseInt(limit));

    res.json({
      terms,
      count: terms.length
    });
  } catch (error) {
    console.error('Common terms analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve common terms' });
  }
});

/**
 * GET /api/v1/analytics/popular-destinations
 * Get most searched destinations
 */
router.get('/popular-destinations', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const destinations = await Analytics.findAll({
      where: {
        selectedPlace: {
          [Analytics.sequelize.Sequelize.Op.ne]: null
        }
      },
      attributes: [
        'selectedPlace',
        [Analytics.sequelize.fn('COUNT', 'id'), 'count']
      ],
      group: ['selectedPlace'],
      order: [[Analytics.sequelize.fn('COUNT', 'id'), 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      destinations: destinations.map(d => ({
        name: d.selectedPlace,
        count: parseInt(d.getDataValue('count'))
      }))
    });
  } catch (error) {
    console.error('Popular destinations analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve popular destinations' });
  }
});

/**
 * GET /api/v1/analytics/quick-ideas
 * Get most selected quick ideas
 */
router.get('/quick-ideas', async (req, res) => {
  try {
    const events = await Analytics.findAll({
      where: {
        quickIdeasSelected: {
          [Analytics.sequelize.Sequelize.Op.ne]: null
        }
      },
      attributes: ['quickIdeasSelected']
    });

    // Count quick idea usage
    const ideasMap = {};
    events.forEach(e => {
      const ideas = e.quickIdeasSelected;
      if (Array.isArray(ideas)) {
        ideas.forEach(id => {
          ideasMap[id] = (ideasMap[id] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(ideasMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }));

    res.json({
      quickIdeas: sorted,
      totalSelections: sorted.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    console.error('Quick ideas analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve quick ideas stats' });
  }
});

/**
 * GET /api/v1/analytics/recent
 * Get recent events
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 50, eventType } = req.query;

    const where = {};
    if (eventType) {
      where.eventType = eventType;
    }

    const events = await Analytics.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Recent events analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve recent events' });
  }
});

export default router;
