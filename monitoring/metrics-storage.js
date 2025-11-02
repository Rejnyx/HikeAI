// monitoring/metrics-storage.js
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METRICS_DIR = join(__dirname, 'metrics');
const BASELINE_FILE = join(METRICS_DIR, 'baseline.json');

/**
 * Ensure metrics directory exists
 */
async function ensureMetricsDir() {
  if (!existsSync(METRICS_DIR)) {
    await mkdir(METRICS_DIR, { recursive: true });
  }
}

/**
 * Save test results as metrics
 */
export async function saveMetrics(results) {
  await ensureMetricsDir();

  const timestamp = Date.now();
  const filename = join(METRICS_DIR, `${results.priority}-${timestamp}.json`);

  try {
    writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`💾 Metrics saved: ${results.priority}-${timestamp}.json`);
  } catch (error) {
    console.error('❌ Failed to save metrics:', error.message);
  }
}

/**
 * Get baseline metrics for a priority level
 */
export async function getBaseline(priority) {
  if (!existsSync(BASELINE_FILE)) {
    return {};
  }

  try {
    const baselines = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));
    return baselines[priority] || {};
  } catch (error) {
    console.error('⚠️  Failed to read baseline:', error.message);
    return {};
  }
}

/**
 * Save baseline metrics for a priority level
 */
export async function saveBaseline(priority, results) {
  await ensureMetricsDir();

  let baselines = {};

  // Read existing baselines
  if (existsSync(BASELINE_FILE)) {
    try {
      baselines = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));
    } catch (error) {
      console.error('⚠️  Failed to read existing baseline, creating new:', error.message);
    }
  }

  // Extract baseline metrics from test results
  baselines[priority] = {};
  for (const test of results.tests) {
    if (test.status === 'pass' && test.duration) {
      baselines[priority][test.name] = {
        duration: test.duration,
        timestamp: results.timestamp,
        details: test.details
      };
    }
  }

  try {
    writeFileSync(BASELINE_FILE, JSON.stringify(baselines, null, 2));
    console.log(`📊 Baseline updated for: ${priority}`);
  } catch (error) {
    console.error('❌ Failed to save baseline:', error.message);
  }
}

/**
 * Get historical metrics for a time period
 */
export async function getHistoricalMetrics(priority, hours = 24) {
  await ensureMetricsDir();

  if (!existsSync(METRICS_DIR)) {
    return [];
  }

  try {
    const files = readdirSync(METRICS_DIR);
    const since = Date.now() - (hours * 60 * 60 * 1000);

    const relevantFiles = files
      .filter(f => f.startsWith(priority) && f.endsWith('.json'))
      .filter(f => {
        const parts = f.split('-');
        if (parts.length < 2) return false;
        const timestamp = parseInt(parts[parts.length - 1].replace('.json', ''));
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
        const data = JSON.parse(readFileSync(join(METRICS_DIR, file), 'utf-8'));
        metrics.push(data);
      } catch (error) {
        console.error(`⚠️  Failed to read metric file ${file}:`, error.message);
      }
    }

    return metrics;
  } catch (error) {
    console.error('❌ Failed to get historical metrics:', error.message);
    return [];
  }
}

/**
 * Get all metrics (for dashboard)
 */
export async function getAllMetrics(hours = 24) {
  const critical = await getHistoricalMetrics('critical', hours);
  const high = await getHistoricalMetrics('high', hours);
  const medium = await getHistoricalMetrics('medium', hours);

  return {
    critical,
    high,
    medium,
    summary: {
      critical: {
        count: critical.length,
        latest: critical[critical.length - 1] || null
      },
      high: {
        count: high.length,
        latest: high[high.length - 1] || null
      },
      medium: {
        count: medium.length,
        latest: medium[medium.length - 1] || null
      }
    }
  };
}

/**
 * Get latest metrics across all priorities
 */
export async function getLatestMetrics() {
  await ensureMetricsDir();

  const result = {
    critical: null,
    high: null,
    medium: null,
    timestamp: new Date().toISOString()
  };

  try {
    const files = readdirSync(METRICS_DIR);

    // Find latest for each priority
    const priorities = ['critical', 'high', 'medium'];

    for (const priority of priorities) {
      const priorityFiles = files
        .filter(f => f.startsWith(priority) && f.endsWith('.json'))
        .sort((a, b) => {
          const tsA = parseInt(a.split('-')[a.split('-').length - 1].replace('.json', ''));
          const tsB = parseInt(b.split('-')[b.split('-').length - 1].replace('.json', ''));
          return tsB - tsA; // Descending order (latest first)
        });

      if (priorityFiles.length > 0) {
        try {
          const data = JSON.parse(readFileSync(join(METRICS_DIR, priorityFiles[0]), 'utf-8'));
          result[priority] = data;
        } catch (error) {
          console.error(`⚠️  Failed to read latest ${priority} metric:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to get latest metrics:', error.message);
  }

  return result;
}

/**
 * Clean up old metrics (keep last N days)
 */
export async function cleanupOldMetrics(daysToKeep = 30) {
  await ensureMetricsDir();

  try {
    const files = readdirSync(METRICS_DIR);
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    let deleted = 0;

    for (const file of files) {
      if (file === 'baseline.json') continue; // Never delete baseline

      const parts = file.split('-');
      if (parts.length < 2) continue;

      const timestamp = parseInt(parts[parts.length - 1].replace('.json', ''));
      if (!isNaN(timestamp) && timestamp < cutoff) {
        try {
          const filePath = join(METRICS_DIR, file);
          // In Node.js, use unlinkSync to delete files
          const { unlinkSync } = await import('fs');
          unlinkSync(filePath);
          deleted++;
        } catch (error) {
          console.error(`⚠️  Failed to delete old metric ${file}:`, error.message);
        }
      }
    }

    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} old metric files`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup old metrics:', error.message);
  }
}

/**
 * Get metrics statistics
 */
export async function getMetricsStats(priority, hours = 24) {
  const metrics = await getHistoricalMetrics(priority, hours);

  if (metrics.length === 0) {
    return null;
  }

  const stats = {
    priority,
    period: `${hours} hours`,
    totalRuns: metrics.length,
    passRates: [],
    averagePassRate: 0,
    trends: {}
  };

  // Calculate pass rates
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

  // Calculate trends per test
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
        samples: durations.length
      };
    }
  }

  return stats;
}
