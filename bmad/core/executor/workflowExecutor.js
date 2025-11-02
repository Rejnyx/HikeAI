/**
 * Workflow Executor
 * Spouští workflows s integrovanými hooks
 *
 * @module workflowExecutor
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as yamlLoad } from 'js-yaml';
import { initializeHooks } from '../hooks/hookLoader.js';
import { executeHooksByType } from '../hooks/hookExecutor.js';
import { getAllHooks } from '../hooks/hookRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Workflow Executor
 * Provádí workflow s hook lifecycle
 */
export class WorkflowExecutor {
  constructor(options = {}) {
    this.options = options;
    this.context = {
      workflow_name: null,
      variables: {},
      outputs: {},
      steps_executed: [],
      errors: []
    };
    this.hooks = null;
    this.hooksEnabled = false;
  }

  /**
   * Načte workflow konfiguraci z YAML
   *
   * @param {string} workflowPath - Cesta k workflow.yaml
   * @returns {Object} Workflow config
   */
  async loadWorkflowConfig(workflowPath) {
    const yamlContent = readFileSync(workflowPath, 'utf-8');
    const config = yamlLoad(yamlContent);

    if (!config.name) {
      throw new Error('Workflow config must have a name');
    }

    return config;
  }

  /**
   * Inicializuje workflow a hooks
   *
   * @param {string} workflowPath - Cesta k workflow.yaml
   * @returns {Promise<Object>} Init result
   */
  async initialize(workflowPath) {
    console.log(`\n🚀 Initializing workflow: ${workflowPath}`);

    // Load workflow config
    const config = await this.loadWorkflowConfig(workflowPath);

    this.context.workflow_name = config.name;
    this.context.workflow_description = config.description;
    this.context.config = config;

    // Initialize hooks if enabled
    const hooksResult = await initializeHooks(config);
    this.hooksEnabled = hooksResult.enabled;
    this.hooks = hooksResult.enabled ? getAllHooks() : [];

    if (this.hooksEnabled) {
      console.log(`✅ Hooks enabled: ${this.hooks.length} hooks loaded`);
    } else {
      console.log(`ℹ️  Hooks disabled`);
    }

    return {
      workflow_name: config.name,
      hooks_enabled: this.hooksEnabled,
      hooks_count: this.hooks.length
    };
  }

  /**
   * Spustí pre-workflow-init hooks
   *
   * @returns {Promise<Object>} Hook result
   */
  async runPreWorkflowInitHooks() {
    if (!this.hooksEnabled) return { status: 'continue' };

    console.log(`\n📌 Running pre-workflow-init hooks...`);

    const result = await executeHooksByType(
      this.hooks,
      'pre-workflow-init',
      this.context
    );

    if (result.status === 'halt') {
      throw new Error(`Pre-workflow-init hooks halted: ${result.message}`);
    }

    // Apply modifications to context
    if (result.modifications) {
      Object.assign(this.context, result.modifications);
    }

    return result;
  }

  /**
   * Spustí post-workflow-init hooks
   *
   * @returns {Promise<Object>} Hook result
   */
  async runPostWorkflowInitHooks() {
    if (!this.hooksEnabled) return { status: 'continue' };

    console.log(`\n📌 Running post-workflow-init hooks...`);

    const result = await executeHooksByType(
      this.hooks,
      'post-workflow-init',
      this.context
    );

    if (result.status === 'halt') {
      throw new Error(`Post-workflow-init hooks halted: ${result.message}`);
    }

    // Apply modifications
    if (result.modifications) {
      Object.assign(this.context, result.modifications);
    }

    return result;
  }

  /**
   * Provede jeden krok workflow
   *
   * @param {Object} step - Step definice
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step) {
    const stepData = {
      step_number: step.number,
      step_title: step.title,
      step_goal: step.goal,
      outputs: {}
    };

    console.log(`\n📍 Step ${step.number}: ${step.title}`);

    // Pre-step hooks
    if (this.hooksEnabled) {
      console.log(`   📌 Running pre-step-execute hooks...`);
      const preResult = await executeHooksByType(
        this.hooks,
        'pre-step-execute',
        this.context,
        stepData
      );

      if (preResult.status === 'halt') {
        throw new Error(`Pre-step hooks halted: ${preResult.message}`);
      }
    }

    // Execute step action
    const actionResult = await step.action(this.context, stepData);
    stepData.outputs = actionResult.outputs || {};

    // Post-step hooks
    if (this.hooksEnabled) {
      console.log(`   📌 Running post-step-execute hooks...`);
      const postResult = await executeHooksByType(
        this.hooks,
        'post-step-execute',
        this.context,
        stepData
      );

      if (postResult.status === 'halt') {
        throw new Error(`Post-step hooks halted: ${postResult.message}`);
      }

      if (postResult.status === 'warn') {
        console.warn(`   ⚠️  Warnings: ${postResult.message}`);
      }
    }

    this.context.steps_executed.push(stepData);
    return stepData;
  }

  /**
   * Spustí pre-completion hooks
   *
   * @returns {Promise<Object>} Hook result
   */
  async runPreCompletionHooks() {
    if (!this.hooksEnabled) return { status: 'continue' };

    console.log(`\n📌 Running pre-completion hooks...`);

    const result = await executeHooksByType(
      this.hooks,
      'pre-completion',
      this.context
    );

    if (result.status === 'halt') {
      throw new Error(`Pre-completion hooks halted: ${result.message}`);
    }

    return result;
  }

  /**
   * Spustí post-completion hooks
   *
   * @returns {Promise<Object>} Hook result
   */
  async runPostCompletionHooks() {
    if (!this.hooksEnabled) return { status: 'continue' };

    console.log(`\n📌 Running post-completion hooks...`);

    const result = await executeHooksByType(
      this.hooks,
      'post-completion',
      this.context
    );

    return result;
  }

  /**
   * Zpracuje chybu s on-error hooks
   *
   * @param {Error} error - Chyba
   * @returns {Promise<void>}
   */
  async handleError(error) {
    console.error(`\n❌ Workflow error: ${error.message}`);

    this.context.error = error;
    this.context.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (this.hooksEnabled) {
      console.log(`\n📌 Running on-error hooks...`);
      await executeHooksByType(
        this.hooks,
        'on-error',
        this.context
      );
    }
  }

  /**
   * Spustí workflow s hooks
   *
   * @param {string} workflowPath - Cesta k workflow.yaml
   * @param {Array} steps - Workflow steps
   * @returns {Promise<Object>} Execution result
   */
  async execute(workflowPath, steps = []) {
    const startTime = Date.now();

    try {
      // Step 1: Initialize
      await this.initialize(workflowPath);

      // Pre-workflow-init hooks
      await this.runPreWorkflowInitHooks();

      // Post-workflow-init hooks
      await this.runPostWorkflowInitHooks();

      // Step 2: Execute workflow steps
      console.log(`\n🔄 Executing ${steps.length} workflow steps...`);

      for (const step of steps) {
        await this.executeStep(step);
      }

      // Pre-completion hooks
      await this.runPreCompletionHooks();

      // Step 3: Completion
      console.log(`\n✅ Workflow completed successfully`);

      // Post-completion hooks
      await this.runPostCompletionHooks();

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        workflow_name: this.context.workflow_name,
        steps_executed: this.context.steps_executed.length,
        duration_ms: duration,
        hooks_enabled: this.hooksEnabled,
        context: this.context
      };

    } catch (error) {
      await this.handleError(error);

      return {
        status: 'error',
        workflow_name: this.context.workflow_name,
        error: error.message,
        steps_executed: this.context.steps_executed.length,
        duration_ms: Date.now() - startTime,
        context: this.context
      };
    }
  }
}

/**
 * Jednoduchá helper funkce pro spuštění workflow
 *
 * @param {string} workflowPath - Cesta k workflow.yaml
 * @param {Array} steps - Workflow steps
 * @returns {Promise<Object>} Result
 */
export async function runWorkflow(workflowPath, steps = []) {
  const executor = new WorkflowExecutor();
  return await executor.execute(workflowPath, steps);
}

export default WorkflowExecutor;
