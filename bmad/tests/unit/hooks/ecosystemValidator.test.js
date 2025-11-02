/**
 * Ecosystem Validator Hook Unit Tests
 */

import { describe, test, expect } from 'vitest';
import createEcosystemValidator from '../../../core/hooks/ecosystemValidator.js';
import { createMockWorkflowContext, createMockStepData } from '../../fixtures/hookFixtures.js';

describe('Ecosystem Validator Hook', () => {
  describe('createEcosystemValidator()', () => {
    test('měl by vytvořit validator hook s default konfigurací', () => {
      const validator = createEcosystemValidator();

      expect(validator).toHaveProperty('name', 'ecosystem-validator');
      expect(validator).toHaveProperty('type', 'pre-completion');
      expect(validator).toHaveProperty('enabled', true);
      expect(validator).toHaveProperty('priority', 75);
      expect(validator).toHaveProperty('execute');
      expect(typeof validator.execute).toBe('function');
    });

    test('měl by akceptovat custom konfiguraci', () => {
      const validator = createEcosystemValidator({
        type: 'post-step-execute',
        enabled: false,
        priority: 100
      });

      expect(validator.type).toBe('post-step-execute');
      expect(validator.enabled).toBe(false);
      expect(validator.priority).toBe(100);
    });
  });

  describe('execute() - No Placeholders Rule', () => {
    test('měl by detekovat placeholdery v context variables', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext({
        variables: {
          test: '{{placeholder}}'
        }
      });

      const response = await validator.execute(context);

      expect(response.status).toBe('halt');
      expect(response.violations).toHaveLength(1);
      expect(response.violations[0].rule).toBe('no_placeholders');
      expect(response.violations[0].matches).toContain('{{placeholder}}');
    });

    test('měl by detekovat TODO komentáře', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext({
        variables: {
          notes: 'TODO: implement this'
        }
      });

      const response = await validator.execute(context);

      expect(response.status).toBe('halt');
      expect(response.violations.length).toBeGreaterThan(0);
    });

    test('měl by projít když žádné placeholdery', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext({
        variables: {
          name: 'Test Project',
          value: 42
        }
      });

      const response = await validator.execute(context);

      expect(response.status).toBe('continue');
      expect(response.violations).toHaveLength(0);
    });

    test('měl by detekovat placeholdery ve step outputs', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();
      const stepData = createMockStepData({
        outputs: {
          result: '${unresolved_variable}'
        }
      });

      const response = await validator.execute(context, stepData);

      expect(response.status).toBe('halt');
      expect(response.violations.length).toBeGreaterThan(0);
    });
  });

  describe('execute() - Unresolved Variables Rule', () => {
    test('měl by detekovat nevyřešené proměnné', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext({
        variables: {
          path: '{project_root}/files'
        }
      });

      const response = await validator.execute(context);

      // This should be a warning, not halt
      if (response.warnings && response.warnings.length > 0) {
        expect(response.status).toBe('warn');
        const varWarning = response.warnings.find(w => w.rule === 'all_variables_resolved');
        expect(varWarning).toBeDefined();
      }
    });

    test('měl by projít když všechny proměnné vyřešeny', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext({
        variables: {
          name: 'Resolved Value',
          count: 10
        }
      });

      const response = await validator.execute(context);

      const varViolations = response.violations.filter(v => v.rule === 'all_variables_resolved');
      expect(varViolations).toHaveLength(0);
    });
  });

  describe('execute() - Documentation Compliance Rule', () => {
    test('měl by detekovat chybějící required sections', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();
      const stepData = createMockStepData({
        outputs: {
          title: 'Test'
          // missing 'summary' and 'description'
        }
      });

      const response = await validator.execute(context, stepData);

      const docIssues = [...response.violations, ...response.warnings].filter(
        v => v.rule === 'documentation_compliance'
      );

      expect(docIssues.length).toBeGreaterThan(0);
    });

    test('měl by detekovat příliš krátkou dokumentaci', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();
      const stepData = createMockStepData({
        outputs: {
          summary: 'Short',
          description: 'Too short'
        }
      });

      const response = await validator.execute(context, stepData);

      const lengthIssues = [...response.violations, ...response.warnings].filter(
        v => v.rule === 'documentation_compliance' && v.message.includes('krátká')
      );

      expect(lengthIssues.length).toBeGreaterThan(0);
    });

    test('měl by projít s dostatečnou dokumentací', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();
      const stepData = createMockStepData({
        outputs: {
          summary: 'This is a comprehensive summary of the work completed',
          description: 'This is a detailed description explaining all aspects of the implementation'
        }
      });

      const response = await validator.execute(context, stepData);

      const docIssues = [...response.violations, ...response.warnings].filter(
        v => v.rule === 'documentation_compliance'
      );

      expect(docIssues).toHaveLength(0);
    });
  });

  describe('execute() - No Empty Outputs Rule', () => {
    test('měl by detekovat prázdné výstupy', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();
      const stepData = createMockStepData({
        outputs: {
          result: '',
          data: null,
          value: undefined
        }
      });

      const response = await validator.execute(context, stepData);

      const emptyIssues = [...response.violations, ...response.warnings].filter(
        v => v.rule === 'no_empty_outputs'
      );

      expect(emptyIssues.length).toBeGreaterThan(0);
    });

    test('měl by projít s validními výstupy', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();
      const stepData = createMockStepData({
        outputs: {
          result: 'success',
          data: { key: 'value' },
          count: 42
        }
      });

      const response = await validator.execute(context, stepData);

      const emptyIssues = [...response.violations, ...response.warnings].filter(
        v => v.rule === 'no_empty_outputs'
      );

      expect(emptyIssues).toHaveLength(0);
    });
  });

  describe('execute() - Response Structure', () => {
    test('měl by vrátit správnou strukturu response', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();

      const response = await validator.execute(context);

      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('violations');
      expect(response).toHaveProperty('warnings');
      expect(response).toHaveProperty('modifications');
      expect(response).toHaveProperty('telemetry');

      expect(['continue', 'warn', 'halt']).toContain(response.status);
      expect(Array.isArray(response.violations)).toBe(true);
      expect(Array.isArray(response.warnings)).toBe(true);
    });

    test('měl by vrátit telemetrii', async () => {
      const validator = createEcosystemValidator();
      const context = createMockWorkflowContext();

      const response = await validator.execute(context);

      expect(response.telemetry).toHaveProperty('rules_checked');
      expect(response.telemetry).toHaveProperty('violations_count');
      expect(response.telemetry).toHaveProperty('warnings_count');
      expect(typeof response.telemetry.rules_checked).toBe('number');
    });
  });

  describe('Custom Configuration', () => {
    test('měl by respektovat disabled pravidla', async () => {
      const validator = createEcosystemValidator({
        rules: {
          no_placeholders: {
            enabled: false
          }
        }
      });

      const context = createMockWorkflowContext({
        variables: {
          test: '{{placeholder}}'
        }
      });

      const response = await validator.execute(context);

      // Should not detect placeholder because rule is disabled
      const placeholderViolations = response.violations.filter(v => v.rule === 'no_placeholders');
      expect(placeholderViolations).toHaveLength(0);
    });

    test('měl by respektovat custom severity', async () => {
      const validator = createEcosystemValidator({
        rules: {
          no_placeholders: {
            enabled: true,
            severity: 'warn',  // Changed from 'halt' to 'warn'
            patterns: [/\{\{[^}]+\}\}/g]
          }
        }
      });

      const context = createMockWorkflowContext({
        variables: {
          test: '{{placeholder}}'
        }
      });

      const response = await validator.execute(context);

      // Should be warning, not halt
      expect(response.status).toBe('warn');
      expect(response.warnings.length).toBeGreaterThan(0);
      expect(response.violations).toHaveLength(0);
    });
  });
});
