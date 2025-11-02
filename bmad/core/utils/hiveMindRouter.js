/**
 * Hive Mind Task Router
 * Routes tasks to appropriate AI workers based on expertise
 */

// Default routing rules (can be overridden by hive-mind.yaml)
const DEFAULT_ROUTING_RULES = {
  'architecture': {
    primary: 'claude-code',
    fallback: null,
    reason: 'Winston (Architect) expertise in system design',
    estimated_duration_min: 30
  },
  'planning': {
    primary: 'claude-code',
    fallback: null,
    reason: 'John (PM) expertise in product strategy',
    estimated_duration_min: 20
  },
  'council': {
    primary: 'claude-code',
    fallback: null,
    reason: 'Sophia (Facilitator) orchestrates multi-agent discussions',
    estimated_duration_min: 15
  },
  'code-review': {
    primary: 'claude-code',
    fallback: null,
    reason: 'Senior developer perspective, strategic review',
    estimated_duration_min: 10
  },
  'documentation': {
    primary: 'gemini-cli',
    fallback: 'claude-code',
    reason: 'Fast iteration, excellent at content generation',
    estimated_duration_min: 5
  },
  'research': {
    primary: 'gemini-cli',
    fallback: 'claude-code',
    reason: 'Mary (Analyst) expertise in market research',
    estimated_duration_min: 10
  },
  'content': {
    primary: 'gemini-cli',
    fallback: 'claude-code',
    reason: 'Blog posts, guides, marketing copy',
    estimated_duration_min: 10
  },
  'implementation': {
    primary: 'codex',
    fallback: 'claude-code',
    reason: 'Fast code generation, implementation speed',
    estimated_duration_min: 10
  },
  'refactoring': {
    primary: 'codex',
    fallback: null,
    reason: 'Specialized for code optimization',
    estimated_duration_min: 5
  },
  'bug-fix': {
    primary: 'codex',
    fallback: 'claude-code',
    reason: 'Automated bug fixing',
    estimated_duration_min: 10
  },
  'test-generation': {
    primary: 'codex',
    fallback: 'claude-code',
    reason: 'Automated test creation',
    estimated_duration_min: 5
  },
  'session-recording': {
    primary: 'nova',
    fallback: null,
    reason: 'Nova specialized function',
    estimated_duration_min: 1
  },
  'analytics': {
    primary: 'nova',
    fallback: null,
    reason: 'Performance tracking and insights',
    estimated_duration_min: 2
  }
};

/**
 * Routes a task to the appropriate AI worker
 * @param {Object} task - The task to route
 * @param {Object} routingRules - Custom routing rules (optional)
 * @returns {Object} - Routing decision with AI worker and metadata
 */
function routeTask(task, routingRules = DEFAULT_ROUTING_RULES) {
  if (!task || !task.type) {
    throw new Error('Task must have a type');
  }

  const rule = routingRules[task.type];

  if (!rule) {
    // Unknown task type - route to general purpose AI
    return {
      ai: 'claude-code',
      reason: 'Unknown task type, routing to general purpose AI',
      estimated_duration_min: 15,
      fallback: null
    };
  }

  return {
    ai: rule.primary,
    reason: rule.reason,
    estimated_duration_min: rule.estimated_duration_min,
    fallback: rule.fallback
  };
}

/**
 * Checks if an AI worker is available
 * @param {string} aiName - Name of the AI worker
 * @param {Object} workers - Worker status object
 * @returns {boolean} - Whether worker is available
 */
function isWorkerAvailable(aiName, workers = {}) {
  const worker = workers[aiName];

  if (!worker) {
    return false; // Worker doesn't exist
  }

  if (worker.status !== 'active') {
    return false; // Worker is not active
  }

  if (worker.current_tasks >= worker.max_concurrent_tasks) {
    return false; // Worker is at capacity
  }

  return true;
}

/**
 * Routes task with fallback logic
 * @param {Object} task - The task to route
 * @param {Object} workers - Worker status
 * @param {Object} routingRules - Custom routing rules
 * @returns {Object} - Routing decision with actual worker to use
 */
function routeTaskWithFallback(task, workers = {}, routingRules = DEFAULT_ROUTING_RULES) {
  const routing = routeTask(task, routingRules);

  // Try primary worker
  if (isWorkerAvailable(routing.ai, workers)) {
    return {
      ...routing,
      worker_used: routing.ai,
      fallback_used: false
    };
  }

  // Try fallback worker
  if (routing.fallback && isWorkerAvailable(routing.fallback, workers)) {
    return {
      ...routing,
      worker_used: routing.fallback,
      fallback_used: true,
      reason: `Primary worker ${routing.ai} unavailable, using fallback`
    };
  }

  // No available worker
  return {
    ...routing,
    worker_used: null,
    fallback_used: false,
    error: 'No available workers for this task'
  };
}

/**
 * Calculates task priority score for scheduling
 * @param {Object} task - The task to score
 * @returns {number} - Priority score (higher = more urgent)
 */
function calculatePriorityScore(task) {
  const priorityValues = {
    'critical': 100,
    'high': 75,
    'medium': 50,
    'low': 25
  };

  let score = priorityValues[task.priority] || 50; // Default to medium

  // Increase score for older tasks (avoid starvation)
  if (task.created_at) {
    const ageHours = (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60);
    score += Math.min(ageHours * 2, 20); // Max +20 for age
  }

  return score;
}

module.exports = {
  DEFAULT_ROUTING_RULES,
  routeTask,
  isWorkerAvailable,
  routeTaskWithFallback,
  calculatePriorityScore
};
