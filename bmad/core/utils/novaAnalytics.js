/**
 * Nova Analytics Utilities
 * Session tracking, metrics calculation, and insights
 */

/**
 * Calculates average duration from session array
 * @param {Array} sessions - Array of session objects
 * @returns {number} - Average duration in minutes
 */
function calculateAverageDuration(sessions) {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const totalDuration = sessions.reduce((sum, session) => {
    return sum + (session.duration_minutes || 0);
  }, 0);

  return Math.round((totalDuration / sessions.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculates success rate from sessions
 * @param {Array} sessions - Array of session objects
 * @returns {number} - Success rate as percentage (0-100)
 */
function calculateSuccessRate(sessions) {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const successCount = sessions.filter(s => s.status === 'success' || s.status === 'completed').length;

  return Math.round((successCount / sessions.length) * 100);
}

/**
 * Calculates average consensus for council sessions
 * @param {Array} sessions - Array of council session objects
 * @returns {number} - Average consensus percentage (0-100)
 */
function calculateAverageConsensus(sessions) {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const consensusSessions = sessions.filter(s => s.consensus_percentage !== undefined);

  if (consensusSessions.length === 0) {
    return 0;
  }

  const totalConsensus = consensusSessions.reduce((sum, session) => {
    return sum + session.consensus_percentage;
  }, 0);

  return Math.round((totalConsensus / consensusSessions.length) * 10) / 10;
}

/**
 * Calculates AI worker utilization statistics
 * @param {Array} sessions - Array of session objects
 * @returns {Object} - Utilization stats per AI worker
 */
function calculateWorkerUtilization(sessions) {
  if (!sessions || sessions.length === 0) {
    return {};
  }

  const workerStats = {};

  sessions.forEach(session => {
    const worker = session.ai_worker || session.ai || 'unknown';

    if (!workerStats[worker]) {
      workerStats[worker] = {
        total_tasks: 0,
        total_duration_min: 0,
        success_count: 0,
        failure_count: 0
      };
    }

    workerStats[worker].total_tasks++;
    workerStats[worker].total_duration_min += session.duration_minutes || 0;

    if (session.status === 'success' || session.status === 'completed') {
      workerStats[worker].success_count++;
    } else if (session.status === 'failed' || session.status === 'error') {
      workerStats[worker].failure_count++;
    }
  });

  // Calculate percentages and averages
  Object.keys(workerStats).forEach(worker => {
    const stats = workerStats[worker];
    stats.success_rate = Math.round((stats.success_count / stats.total_tasks) * 100);
    stats.avg_duration_min = Math.round((stats.total_duration_min / stats.total_tasks) * 10) / 10;
    stats.utilization_percentage = Math.round((stats.total_tasks / sessions.length) * 100);
  });

  return workerStats;
}

/**
 * Detects performance trends
 * @param {Array} sessions - Array of session objects (sorted by date)
 * @returns {Object} - Trend analysis
 */
function detectTrends(sessions) {
  if (!sessions || sessions.length < 3) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 3 sessions to detect trends'
    };
  }

  // Split sessions into two halves
  const midpoint = Math.floor(sessions.length / 2);
  const firstHalf = sessions.slice(0, midpoint);
  const secondHalf = sessions.slice(midpoint);

  const firstHalfAvgDuration = calculateAverageDuration(firstHalf);
  const secondHalfAvgDuration = calculateAverageDuration(secondHalf);

  const firstHalfSuccessRate = calculateSuccessRate(firstHalf);
  const secondHalfSuccessRate = calculateSuccessRate(secondHalf);

  const durationChange = ((secondHalfAvgDuration - firstHalfAvgDuration) / firstHalfAvgDuration) * 100;
  const successRateChange = secondHalfSuccessRate - firstHalfSuccessRate;

  let trend = 'stable';
  let message = '';

  if (durationChange < -10 && successRateChange >= 0) {
    trend = 'improving';
    message = 'Performance improving: faster completion with maintained/improved success rate';
  } else if (durationChange > 10 && successRateChange < 0) {
    trend = 'degrading';
    message = 'Performance degrading: slower completion with decreased success rate';
  } else if (successRateChange > 10) {
    trend = 'improving';
    message = 'Quality improving: significantly higher success rate';
  } else if (successRateChange < -10) {
    trend = 'degrading';
    message = 'Quality degrading: significantly lower success rate';
  } else {
    trend = 'stable';
    message = 'Performance stable: no significant changes detected';
  }

  return {
    trend,
    message,
    metrics: {
      duration_change_percentage: Math.round(durationChange * 10) / 10,
      success_rate_change: Math.round(successRateChange * 10) / 10,
      first_half_avg_duration: firstHalfAvgDuration,
      second_half_avg_duration: secondHalfAvgDuration,
      first_half_success_rate: firstHalfSuccessRate,
      second_half_success_rate: secondHalfSuccessRate
    }
  };
}

/**
 * Generates performance recommendations
 * @param {Object} trends - Trend analysis object
 * @param {Object} workerStats - Worker utilization stats
 * @returns {Array} - Array of recommendation strings
 */
function generateRecommendations(trends, workerStats) {
  const recommendations = [];

  // Trend-based recommendations
  if (trends.trend === 'degrading') {
    recommendations.push('⚠️ Performance is degrading. Consider reviewing recent changes.');
    recommendations.push('📊 Analyze failed sessions to identify common issues.');
  } else if (trends.trend === 'improving') {
    recommendations.push('✅ Performance is improving. Continue current practices.');
  }

  // Worker-based recommendations
  Object.entries(workerStats).forEach(([worker, stats]) => {
    if (stats.success_rate < 80) {
      recommendations.push(`⚠️ ${worker} has low success rate (${stats.success_rate}%). Review task assignments.`);
    }

    if (stats.avg_duration_min > 30) {
      recommendations.push(`⏱️ ${worker} has high average duration (${stats.avg_duration_min} min). Consider task optimization.`);
    }

    if (stats.utilization_percentage > 80) {
      recommendations.push(`🔥 ${worker} is heavily utilized (${stats.utilization_percentage}%). Consider load balancing.`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operating within normal parameters.');
  }

  return recommendations;
}

module.exports = {
  calculateAverageDuration,
  calculateSuccessRate,
  calculateAverageConsensus,
  calculateWorkerUtilization,
  detectTrends,
  generateRecommendations
};
