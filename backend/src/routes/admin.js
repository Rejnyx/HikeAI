import express from 'express';
import { getFallbackStats, suggestNewPatterns, getAllFallbacks, clearFallbackLogs } from '../services/llmFallbackLogger.js';
import { getPatternStats } from '../services/regexExtractor.js';

const router = express.Router();

/**
 * GET /api/v1/admin/pattern-mining/stats
 * Get aggregated statistics about regex patterns and LLM fallbacks
 */
router.get('/pattern-mining/stats', async (req, res) => {
  try {
    const fallbackStats = getFallbackStats();
    const patternStats = getPatternStats();

    // Calculate hit rate
    const totalExtractions = fallbackStats.totalFallbacks; // Assuming we don't track regex hits separately yet
    const regexHits = 0; // TODO: Implement regex hit tracking
    const llmFallbacks = fallbackStats.totalFallbacks;

    const hitRate = totalExtractions > 0
      ? ((regexHits / totalExtractions) * 100).toFixed(2)
      : 0;

    res.json({
      summary: {
        totalExtractions,
        regexHits,
        llmFallbacks,
        hitRate: `${hitRate}%`,
        avgFallbackTime: `${fallbackStats.avgExtractionTime}ms`,
        totalCost: `$${fallbackStats.totalCost}`
      },
      fallbacks: fallbackStats,
      patterns: patternStats
    });
  } catch (error) {
    console.error('❌ Error getting pattern mining stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/pattern-mining/suggest
 * Get AI-suggested new regex patterns based on LLM fallback logs
 */
router.get('/pattern-mining/suggest', async (req, res) => {
  try {
    const minOccurrences = parseInt(req.query.minOccurrences) || 3;
    const suggestions = suggestNewPatterns(minOccurrences);

    res.json({
      minOccurrences,
      totalSuggestions: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error('❌ Error getting pattern suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/pattern-mining/fallbacks
 * Get all LLM fallback logs (with optional pagination)
 */
router.get('/pattern-mining/fallbacks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const allFallbacks = getAllFallbacks();
    const paginatedFallbacks = allFallbacks.slice(offset, offset + limit);

    res.json({
      total: allFallbacks.length,
      limit,
      offset,
      fallbacks: paginatedFallbacks
    });
  } catch (error) {
    console.error('❌ Error getting fallback logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/admin/pattern-mining/fallbacks
 * Clear all LLM fallback logs (use with caution!)
 */
router.delete('/pattern-mining/fallbacks', async (req, res) => {
  try {
    // Safety check: require confirmation query param
    const confirmation = req.query.confirm;

    if (confirmation !== 'YES_DELETE_ALL') {
      return res.status(400).json({
        error: 'Missing confirmation. Add ?confirm=YES_DELETE_ALL to delete all logs.'
      });
    }

    clearFallbackLogs();

    res.json({
      success: true,
      message: 'All fallback logs have been cleared.'
    });
  } catch (error) {
    console.error('❌ Error clearing fallback logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/admin/pattern-mining/top-prompts
 * Get most frequent prompts that fell back to LLM (quick analysis endpoint)
 */
router.get('/pattern-mining/top-prompts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const stats = getFallbackStats();

    res.json({
      topPrompts: stats.topPrompts.slice(0, limit)
    });
  } catch (error) {
    console.error('❌ Error getting top prompts:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
