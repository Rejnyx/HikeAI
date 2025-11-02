import express from 'express';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const router = express.Router();

// Path to monitoring metrics directory
const METRICS_DIR = join(process.cwd(), '../monitoring/metrics');

/**
 * GET /api/v1/monitoring/latest
 * Get latest metrics across all priority levels
 */
router.get('/latest', async (req, res) => {
  try {
    if (!existsSync(METRICS_DIR)) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        critical: null,
        high: null,
        medium: null,
        message: 'Monitoring metrics not yet available. Run continuous testing to generate metrics.'
      });
    }

    const files = readdirSync(METRICS_DIR);
    const result = {
      timestamp: new Date().toISOString(),
      critical: null,
      high: null,
      medium: null
    };

    // Find latest for each priority
    const priorities = ['critical', 'high', 'medium'];

    for (const priority of priorities) {
      const priorityFiles = files
        .filter(f => f.startsWith(priority) && f.endsWith('.json') && f !== 'baseline.json')
        .sort((a, b) => {
          const tsA = parseInt(a.split('-')[a.split('-').length - 1].replace('.json', ''));
          const tsB = parseInt(b.split('-')[b.split('-').length - 1].replace('.json', ''));
          return tsB - tsA; // Descending (latest first)
        });

      if (priorityFiles.length > 0) {
        try {
          const filePath = join(METRICS_DIR, priorityFiles[0]);
          const data = JSON.parse(readFileSync(filePath, 'utf-8'));
          result[priority] = data;
        } catch (error) {
          console.error(`Failed to read ${priority} metrics:`, error.message);
        }
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Monitoring API error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch monitoring data'
    });
  }
});

/**
 * GET /api/v1/monitoring/history
 * Get historical metrics for a time period
 * Query params:
 *   - priority: critical|high|medium (default: all)
 *   - hours: number of hours to look back (default: 24)
 */
router.get('/history', async (req, res) => {
  try {
    const { priority = 'all', hours = 24 } = req.query;

    if (!existsSync(METRICS_DIR)) {
      return res.status(200).json({
        metrics: [],
        message: 'No historical data available yet'
      });
    }

    const files = readdirSync(METRICS_DIR);
    const since = Date.now() - (hours * 60 * 60 * 1000);
    const priorities = priority === 'all' ? ['critical', 'high', 'medium'] : [priority];

    const metrics = [];

    for (const pri of priorities) {
      const priorityFiles = files
        .filter(f => f.startsWith(pri) && f.endsWith('.json') && f !== 'baseline.json')
        .filter(f => {
          const timestamp = parseInt(f.split('-')[f.split('-').length - 1].replace('.json', ''));
          return !isNaN(timestamp) && timestamp > since;
        })
        .sort((a, b) => {
          const tsA = parseInt(a.split('-')[a.split('-').length - 1].replace('.json', ''));
          const tsB = parseInt(b.split('-')[b.split('-').length - 1].replace('.json', ''));
          return tsA - tsB; // Ascending (oldest first)
        });

      for (const file of priorityFiles) {
        try {
          const filePath = join(METRICS_DIR, file);
          const data = JSON.parse(readFileSync(filePath, 'utf-8'));
          metrics.push(data);
        } catch (error) {
          console.error(`Failed to read metric file ${file}:`, error.message);
        }
      }
    }

    res.status(200).json({
      metrics,
      count: metrics.length,
      period: `${hours} hours`,
      priority: priority === 'all' ? 'all priorities' : priority
    });
  } catch (error) {
    console.error('Monitoring history API error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch historical data'
    });
  }
});

/**
 * GET /api/v1/monitoring/stats
 * Get statistics and trends
 * Query params:
 *   - priority: critical|high|medium
 *   - hours: number of hours (default: 24)
 */
router.get('/stats', async (req, res) => {
  try {
    const { priority = 'critical', hours = 24 } = req.query;

    if (!existsSync(METRICS_DIR)) {
      return res.status(200).json({
        stats: null,
        message: 'No stats available yet'
      });
    }

    // Get historical metrics
    const files = readdirSync(METRICS_DIR);
    const since = Date.now() - (hours * 60 * 60 * 1000);

    const relevantFiles = files
      .filter(f => f.startsWith(priority) && f.endsWith('.json') && f !== 'baseline.json')
      .filter(f => {
        const timestamp = parseInt(f.split('-')[f.split('-').length - 1].replace('.json', ''));
        return !isNaN(timestamp) && timestamp > since;
      })
      .sort((a, b) => {
        const tsA = parseInt(a.split('-')[a.split('-').length - 1].replace('.json', ''));
        const tsB = parseInt(b.split('-')[b.split('-').length - 1].replace('.json', ''));
        return tsA - tsB;
      });

    const metrics = [];
    for (const file of relevantFiles) {
      try {
        const filePath = join(METRICS_DIR, file);
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        metrics.push(data);
      } catch (error) {
        console.error(`Failed to read metric file ${file}:`, error.message);
      }
    }

    if (metrics.length === 0) {
      return res.status(200).json({
        stats: null,
        message: 'Not enough data for statistics'
      });
    }

    // Calculate statistics
    const stats = {
      priority,
      period: `${hours} hours`,
      totalRuns: metrics.length,
      passRates: [],
      averagePassRate: 0,
      trends: {}
    };

    // Pass rates over time
    for (const metric of metrics) {
      const passRate = parseFloat(metric.summary.passRate);
      stats.passRates.push({
        timestamp: metric.timestamp,
        passRate
      });
    }

    // Average pass rate
    stats.averagePassRate = (
      stats.passRates.reduce((sum, pr) => sum + pr.passRate, 0) / stats.passRates.length
    ).toFixed(2);

    // Trends per test
    const testNames = new Set();
    metrics.forEach(m => m.tests.forEach(t => testNames.add(t.name)));

    for (const testName of testNames) {
      const durations = [];

      for (const metric of metrics) {
        const test = metric.tests.find(t => t.name === testName);
        if (test && test.duration) {
          durations.push({
            timestamp: metric.timestamp,
            duration: test.duration,
            status: test.status
          });
        }
      }

      if (durations.length > 0) {
        const avgDuration = durations.reduce((sum, d) => sum + d.duration, 0) / durations.length;
        const trend = durations.length > 1
          ? ((durations[durations.length - 1].duration - durations[0].duration) / durations[0].duration) * 100
          : 0;

        stats.trends[testName] = {
          averageDuration: avgDuration.toFixed(2),
          trend: trend.toFixed(2) + '%',
          samples: durations.length,
          latest: durations[durations.length - 1]
        };
      }
    }

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Monitoring stats API error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to calculate statistics'
    });
  }
});

export default router;
