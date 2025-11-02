/**
 * Hook Executor
 * Zodpovídá za provádění hooks v BMAD workflow engine
 *
 * @module hookExecutor
 */

/**
 * Provede hook s daným kontextem
 *
 * @param {Object} hook - Hook object
 * @param {string} hook.name - Název hooku
 * @param {string} hook.type - Typ hooku (pre-workflow-init, post-step-execute, etc.)
 * @param {Function} hook.execute - Funkce k provedení
 * @param {Object} hook.config - Konfigurace hooku
 * @param {Object} context - Workflow context
 * @param {Object} [stepData] - Data aktuálního kroku (pro step hooks)
 * @returns {Promise<HookResponse>}
 */
export async function executeHook(hook, context, stepData = null) {
  const startTime = Date.now();

  try {
    // Validate hook
    validateHook(hook);

    // Log hook execution start
    logHookExecution(hook, 'start');

    // Execute hook function
    const response = await hook.execute(context, stepData);

    // Validate response
    validateHookResponse(response);

    // Add telemetry
    response.telemetry = {
      ...response.telemetry,
      execution_time_ms: Date.now() - startTime,
      hook_name: hook.name,
      hook_type: hook.type,
      timestamp: new Date().toISOString()
    };

    // Log hook execution end
    logHookExecution(hook, 'end', response);

    return response;

  } catch (error) {
    // Log error
    logHookError(hook, error);

    // Return error response
    return {
      status: 'halt',
      message: `Hook execution failed: ${error.message}`,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      modifications: {},
      telemetry: {
        execution_time_ms: Date.now() - startTime,
        hook_name: hook.name,
        hook_type: hook.type,
        timestamp: new Date().toISOString(),
        error: true
      }
    };
  }
}

/**
 * Provede všechny hooks pro daný typ
 *
 * @param {Array<Object>} hooks - Pole hooks k provedení
 * @param {string} hookType - Typ hooku
 * @param {Object} context - Workflow context
 * @param {Object} [stepData] - Data kroku
 * @returns {Promise<HookExecutionResult>}
 */
export async function executeHooksByType(hooks, hookType, context, stepData = null) {
  const startTime = Date.now();

  // Filter hooks by type and enabled status
  const applicableHooks = hooks
    .filter(hook => hook.type === hookType && hook.enabled !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Higher priority first

  if (applicableHooks.length === 0) {
    return {
      status: 'continue',
      message: `No hooks registered for type: ${hookType}`,
      hooks_executed: 0,
      responses: [],
      telemetry: {
        total_execution_time_ms: 0,
        hook_type: hookType
      }
    };
  }

  const responses = [];
  let overallStatus = 'continue';
  let contextModifications = {};

  // Execute hooks in priority order
  for (const hook of applicableHooks) {
    const response = await executeHook(hook, context, stepData);
    responses.push(response);

    // Apply context modifications
    if (response.modifications && Object.keys(response.modifications).length > 0) {
      contextModifications = {
        ...contextModifications,
        ...response.modifications
      };
      // Update context with modifications
      Object.assign(context, response.modifications);
    }

    // Check for halt or warn
    if (response.status === 'halt') {
      overallStatus = 'halt';
      break; // Stop execution on halt
    } else if (response.status === 'warn' && overallStatus !== 'halt') {
      overallStatus = 'warn';
    }
  }

  return {
    status: overallStatus,
    message: `Executed ${responses.length} hooks for ${hookType}`,
    hooks_executed: responses.length,
    responses,
    modifications: contextModifications,
    telemetry: {
      total_execution_time_ms: Date.now() - startTime,
      hook_type: hookType,
      hooks_count: applicableHooks.length,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Validuje hook object
 */
function validateHook(hook) {
  if (!hook) {
    throw new Error('Hook is null or undefined');
  }

  if (!hook.name) {
    throw new Error('Hook must have a name');
  }

  if (!hook.type) {
    throw new Error(`Hook "${hook.name}" must have a type`);
  }

  if (typeof hook.execute !== 'function') {
    throw new Error(`Hook "${hook.name}" must have an execute function`);
  }
}

/**
 * Validuje hook response
 */
function validateHookResponse(response) {
  if (!response) {
    throw new Error('Hook response is null or undefined');
  }

  if (!response.status) {
    throw new Error('Hook response must have a status field');
  }

  if (!['continue', 'warn', 'halt'].includes(response.status)) {
    throw new Error(`Invalid hook status: ${response.status}. Must be: continue, warn, or halt`);
  }
}

/**
 * Loguje hook execution
 */
function logHookExecution(hook, phase, response = null) {
  if (phase === 'start') {
    console.log(`🔗 Hook [${hook.type}] "${hook.name}" starting...`);
  } else if (phase === 'end') {
    const icon = response.status === 'halt' ? '🛑' : response.status === 'warn' ? '⚠️' : '✅';
    console.log(`${icon} Hook "${hook.name}" completed - Status: ${response.status}`);

    if (response.message) {
      console.log(`   Message: ${response.message}`);
    }
  }
}

/**
 * Loguje hook error
 */
function logHookError(hook, error) {
  console.error(`❌ Hook "${hook.name}" failed:`, error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}

/**
 * Hook response type definition
 * @typedef {Object} HookResponse
 * @property {'continue'|'warn'|'halt'} status - Execution status
 * @property {string} message - Human-readable message
 * @property {Object} [modifications] - Context modifications
 * @property {Object} telemetry - Execution metrics
 */

/**
 * Hook execution result type definition
 * @typedef {Object} HookExecutionResult
 * @property {'continue'|'warn'|'halt'} status - Overall status
 * @property {string} message - Summary message
 * @property {number} hooks_executed - Number of hooks executed
 * @property {Array<HookResponse>} responses - Individual hook responses
 * @property {Object} [modifications] - Aggregated modifications
 * @property {Object} telemetry - Execution metrics
 */

export default {
  executeHook,
  executeHooksByType
};
