// monitoring/analyzer.js
import { getBaseline, saveBaseline } from './metrics-storage.js';

/**
 * Analyze test results and compare to baseline
 */
export async function analyzeResults(results, priority) {
  const analysis = {
    timestamp: results.timestamp,
    priority,
    status: 'healthy',
    alerts: [],
    recommendations: [],
    summary: results.summary
  };

  // Get baseline for comparison
  const baseline = await getBaseline(priority);

  // Analyze pass rate
  const passRate = parseFloat(results.summary.passRate);

  if (passRate < 100) {
    analysis.status = priority === 'critical' ? 'critical' : 'degraded';
    analysis.alerts.push({
      severity: priority === 'critical' ? 'critical' : 'warning',
      message: `Pass rate dropped to ${passRate}%. Expected 100%.`,
      failedTests: results.tests.filter(t => t.status === 'fail').map(t => ({
        name: t.name,
        error: t.error
      }))
    });
  }

  // Check for warnings
  const warnings = results.tests.filter(t => t.status === 'warn');
  if (warnings.length > 0 && analysis.status === 'healthy') {
    analysis.status = 'degraded';
  }

  // Analyze performance degradation
  for (const test of results.tests) {
    if (test.duration && baseline[test.name]) {
      const baselineDuration = baseline[test.name].duration;
      const degradation = ((test.duration - baselineDuration) / baselineDuration) * 100;

      if (degradation > 50) {
        // Severe performance degradation
        analysis.alerts.push({
          severity: 'critical',
          message: `${test.name} performance severely degraded by ${degradation.toFixed(1)}%`,
          current: `${test.duration}ms`,
          baseline: `${baselineDuration}ms`,
          degradation: `${degradation.toFixed(1)}%`
        });
        if (analysis.status === 'healthy') {
          analysis.status = 'degraded';
        }
      } else if (degradation > 20) {
        // Moderate performance degradation
        analysis.alerts.push({
          severity: 'warning',
          message: `${test.name} performance degraded by ${degradation.toFixed(1)}%`,
          current: `${test.duration}ms`,
          baseline: `${baselineDuration}ms`,
          degradation: `${degradation.toFixed(1)}%`
        });
      }
    }
  }

  // Update baseline if all tests passed and no significant degradation
  if (passRate === 100 && analysis.status === 'healthy') {
    await saveBaseline(priority, results);
  }

  // Generate recommendations
  if (analysis.alerts.length > 0) {
    analysis.recommendations = generateRecommendations(analysis.alerts, results.tests);
  }

  return analysis;
}

/**
 * Send alerts if needed based on analysis
 */
export async function alertIfNeeded(analysis) {
  if (analysis.status === 'healthy' && analysis.alerts.length === 0) {
    return; // No alerts needed
  }

  // Critical alerts - immediate notification
  const criticalAlerts = analysis.alerts.filter(a => a.severity === 'critical');
  if (criticalAlerts.length > 0) {
    await sendConsoleAlert(criticalAlerts, 'CRITICAL', analysis.priority);
    // In production, also send Slack/Email
    // await sendSlackAlert(criticalAlerts, 'CRITICAL');
    // await sendEmailAlert(criticalAlerts, 'CRITICAL');
  }

  // Warning alerts - console only (dashboard in production)
  const warnings = analysis.alerts.filter(a => a.severity === 'warning');
  if (warnings.length > 0) {
    await sendConsoleAlert(warnings, 'WARNING', analysis.priority);
    // In production, update dashboard
    // await updateDashboard(warnings);
  }

  console.log('🚨 Alerts summary:', {
    critical: criticalAlerts.length,
    warnings: warnings.length,
    status: analysis.status
  });
}

/**
 * Generate actionable recommendations based on alerts
 */
function generateRecommendations(alerts, tests) {
  const recommendations = [];

  for (const alert of alerts) {
    if (alert.message.includes('Pass rate dropped')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Check failed tests immediately and investigate root cause',
        tests: alert.failedTests?.map(t => t.name) || []
      });

      // Specific recommendations based on failed tests
      const failedTestNames = alert.failedTests?.map(t => t.name.toLowerCase()) || [];

      if (failedTestNames.some(n => n.includes('database'))) {
        recommendations.push({
          priority: 'CRITICAL',
          action: 'Database connection issue detected',
          steps: [
            'Verify database server is running',
            'Check connection credentials in .env',
            'Review database logs for errors',
            'Check connection pool settings'
          ]
        });
      }

      if (failedTestNames.some(n => n.includes('api') || n.includes('health'))) {
        recommendations.push({
          priority: 'CRITICAL',
          action: 'Backend API not responding',
          steps: [
            'Verify backend server is running on port 3000',
            'Check for port conflicts',
            'Review backend logs for startup errors',
            'Verify all environment variables are set'
          ]
        });
      }

      if (failedTestNames.some(n => n.includes('route generation'))) {
        recommendations.push({
          priority: 'HIGH',
          action: 'Route generation pipeline broken',
          steps: [
            'Verify OpenAI API key is valid',
            'Check Mapy.cz API connectivity',
            'Review route generation logs',
            'Test individual pipeline components'
          ]
        });
      }
    }

    if (alert.message.includes('performance degraded')) {
      const degradation = parseFloat(alert.degradation);

      if (degradation > 50) {
        recommendations.push({
          priority: 'HIGH',
          action: 'Severe performance degradation detected',
          steps: [
            'Review recent code changes that might affect performance',
            'Check database query performance and indexes',
            'Monitor server resource usage (CPU, memory, disk I/O)',
            'Consider scaling resources or optimizing critical paths'
          ]
        });
      } else {
        recommendations.push({
          priority: 'MEDIUM',
          action: 'Moderate performance degradation',
          steps: [
            'Review recent deployments',
            'Check for increased load or traffic',
            'Review API response times',
            'Consider implementing caching'
          ]
        });
      }
    }

    if (alert.message.includes('Security')) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Security gate issue detected',
        steps: [
          'Review CORS configuration immediately',
          'Verify rate limiting is active',
          'Check for security patches needed',
          'Review security logs for anomalies'
        ]
      });
    }

    if (alert.message.includes('BMAD') || alert.message.includes('Test Suite')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Test suite failures detected',
        steps: [
          'Run tests locally to reproduce',
          'Check for environment differences',
          'Review recent code changes',
          'Check test logs for specific failures'
        ]
      });
    }
  }

  return recommendations;
}

/**
 * Send console alert (development/local)
 */
async function sendConsoleAlert(alerts, severity, priority) {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`🚨 ${severity} ALERT - ${priority.toUpperCase()} PRIORITY`);
  console.log('═'.repeat(60));

  for (const alert of alerts) {
    console.log('');
    console.log(`📌 ${alert.message}`);

    if (alert.failedTests && alert.failedTests.length > 0) {
      console.log('   Failed Tests:');
      alert.failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.error || 'Unknown error'}`);
      });
    }

    if (alert.current && alert.baseline) {
      console.log(`   Current: ${alert.current}`);
      console.log(`   Baseline: ${alert.baseline}`);
      console.log(`   Degradation: ${alert.degradation}`);
    }
  }

  console.log('');
  console.log('═'.repeat(60));
}

/**
 * Send Slack alert (production - placeholder)
 */
async function sendSlackAlert(alerts, severity) {
  // Placeholder for Slack webhook integration
  // In production, implement:
  /*
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;

  const payload = {
    text: `🚨 ${severity} Alert - HikeAI Monitoring`,
    attachments: alerts.map(alert => ({
      color: severity === 'CRITICAL' ? 'danger' : 'warning',
      title: alert.message,
      fields: [
        { title: 'Severity', value: alert.severity, short: true },
        { title: 'Timestamp', value: new Date().toISOString(), short: true }
      ]
    }))
  };

  await axios.post(webhook, payload);
  */

  console.log(`📱 [Placeholder] Would send Slack alert for ${alerts.length} ${severity} alerts`);
}

/**
 * Send Email alert (production - placeholder)
 */
async function sendEmailAlert(alerts, severity) {
  // Placeholder for email integration
  // In production, implement with nodemailer or similar

  console.log(`📧 [Placeholder] Would send Email alert for ${alerts.length} ${severity} alerts`);
}

/**
 * Update Dashboard (production - placeholder)
 */
async function updateDashboard(warnings) {
  // Placeholder for dashboard update
  // In production, implement with WebSocket or API update

  console.log(`📊 [Placeholder] Would update dashboard with ${warnings.length} warnings`);
}
