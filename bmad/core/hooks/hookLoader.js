/**
 * Hook Loader
 * Načítá a inicializuje hooks pro BMAD workflow engine
 *
 * @module hookLoader
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as yamlLoad } from 'js-yaml';
import { registerHook, clearRegistry, getAllHooks } from './hookRegistry.js';
import createEcosystemValidator from './ecosystemValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Načte hooks z YAML konfigurace
 *
 * @param {string} [configPath] - Cesta k hooks.yaml (optional, použije default)
 * @returns {Promise<Object>} Načtené hooks info
 */
export async function loadHooks(configPath = null) {
  try {
    // Default config path
    const defaultPath = resolve(__dirname, './hooks.yaml');
    const finalPath = configPath || defaultPath;

    console.log(`📄 Loading hooks from: ${finalPath}`);

    // Read and parse YAML
    const yamlContent = readFileSync(finalPath, 'utf-8');
    const config = yamlLoad(yamlContent);

    if (!config || !config.hooks) {
      throw new Error('Invalid hooks configuration: missing "hooks" array');
    }

    // Clear existing registry
    clearRegistry();

    // Register hooks
    let loaded = 0;
    for (const hookConfig of config.hooks) {
      // Skip disabled hooks
      if (hookConfig.enabled === false) {
        console.log(`⏭️  Skipping disabled hook: "${hookConfig.name}"`);
        continue;
      }

      // Create hook with actual implementation
      const hook = createHookFromConfig(hookConfig);

      if (hook) {
        registerHook(hook);
        loaded++;
      }
    }

    const result = {
      loaded,
      total: config.hooks.length,
      config: config.config || {},
      hooks: getAllHooks()
    };

    console.log(`✅ Loaded ${loaded}/${config.hooks.length} hooks`);

    return result;

  } catch (error) {
    console.error(`❌ Failed to load hooks: ${error.message}`);
    throw error;
  }
}

/**
 * Vytvoří hook object z konfigurace
 *
 * @param {Object} hookConfig - Hook configuration z YAML
 * @returns {Object|null} Hook object nebo null
 */
function createHookFromConfig(hookConfig) {
  const { name, type, priority, config } = hookConfig;

  // Map hook names to implementations
  switch (name) {
    case 'ecosystem-validator-completion':
    case 'ecosystem-validator-step':
      return createEcosystemValidator({
        ...config,
        name,
        type,
        priority,
        enabled: true
      });

    case 'telemetry-init':
      return createTelemetryInitHook({ type, priority, config });

    case 'telemetry-completion':
      return createTelemetryCompletionHook({ type, priority, config });

    case 'error-handler':
      return createErrorHandlerHook({ type, priority, config });

    default:
      console.warn(`⚠️  Unknown hook type: "${name}" - using placeholder`);
      return createPlaceholderHook({ name, type, priority, config });
  }
}

/**
 * Telemetry Init Hook
 */
function createTelemetryInitHook({ type, priority, config }) {
  return {
    name: 'telemetry-init',
    type,
    priority: priority || 75,
    enabled: true,
    config,
    execute: async (context) => {
      const startTime = Date.now();

      // Collect system info if configured
      if (config.collect_system_info) {
        context.telemetry = {
          start_time: new Date().toISOString(),
          workflow_name: context.workflow_name,
          node_version: process.version,
          platform: process.platform
        };
      }

      return {
        status: 'continue',
        message: 'Telemetrie inicializována',
        modifications: context.telemetry ? { telemetry: context.telemetry } : {},
        telemetry: {
          execution_time_ms: Date.now() - startTime
        }
      };
    }
  };
}

/**
 * Telemetry Completion Hook
 */
function createTelemetryCompletionHook({ type, priority, config }) {
  return {
    name: 'telemetry-completion',
    type,
    priority: priority || 75,
    enabled: true,
    config,
    execute: async (context) => {
      const startTime = Date.now();

      if (config.collect_metrics && context.telemetry) {
        context.telemetry.end_time = new Date().toISOString();

        if (context.telemetry.start_time) {
          const start = new Date(context.telemetry.start_time);
          const end = new Date(context.telemetry.end_time);
          context.telemetry.total_duration_ms = end - start;
        }
      }

      return {
        status: 'continue',
        message: 'Telemetrie dokončena',
        modifications: {},
        telemetry: {
          execution_time_ms: Date.now() - startTime
        }
      };
    }
  };
}

/**
 * Error Handler Hook
 */
function createErrorHandlerHook({ type, priority, config }) {
  return {
    name: 'error-handler',
    type,
    priority: priority || 100,
    enabled: true,
    config,
    execute: async (context, stepData) => {
      const startTime = Date.now();

      // Log errors if configured
      if (config.log_errors && context.error) {
        console.error(`🚨 Workflow Error:`, context.error);

        if (stepData) {
          console.error(`   Step: ${stepData.step_number} - ${stepData.step_title}`);
        }
      }

      return {
        status: 'continue', // Don't halt on error logging
        message: 'Chyba zalogována',
        modifications: {},
        telemetry: {
          execution_time_ms: Date.now() - startTime,
          error_logged: true
        }
      };
    }
  };
}

/**
 * Placeholder Hook (pro budoucí implementaci)
 */
function createPlaceholderHook({ name, type, priority, config }) {
  return {
    name,
    type,
    priority: priority || 50,
    enabled: true,
    config,
    execute: async () => {
      return {
        status: 'continue',
        message: `Placeholder hook "${name}" executed`,
        modifications: {},
        telemetry: {
          placeholder: true
        }
      };
    }
  };
}

/**
 * Zkontroluje jestli jsou hooks enabled v konfiguraci
 *
 * @param {Object} workflowConfig - Workflow konfigurace
 * @returns {boolean} True pokud hooks jsou enabled
 */
export function areHooksEnabled(workflowConfig) {
  if (!workflowConfig) {
    return false;
  }

  // Check if hooks_enabled flag exists
  if (workflowConfig.hooks_enabled !== undefined) {
    return workflowConfig.hooks_enabled === true;
  }

  // Default: disabled (opt-in)
  return false;
}

/**
 * Inicializuje hooks systém pro workflow
 *
 * @param {Object} workflowConfig - Workflow konfigurace
 * @returns {Promise<Object>} Init result
 */
export async function initializeHooks(workflowConfig) {
  // Check if hooks are enabled
  if (!areHooksEnabled(workflowConfig)) {
    console.log('⏭️  Hooks disabled - skipping initialization');
    return {
      enabled: false,
      loaded: 0,
      hooks: []
    };
  }

  // Load hooks
  const configPath = workflowConfig.hooks_config || null;
  const result = await loadHooks(configPath);

  return {
    enabled: true,
    ...result
  };
}

export default {
  loadHooks,
  areHooksEnabled,
  initializeHooks
};
