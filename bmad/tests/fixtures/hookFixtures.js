/**
 * Hook Test Fixtures
 * Mockové data pro testování hooks systému
 */

export const mockHookConfig = {
  hooks: [
    {
      name: 'test-hook-1',
      type: 'pre-workflow-init',
      enabled: true,
      priority: 100,
      config: {
        rules_file: 'test-rules.yaml',
        enforcement_level: 'strict'
      }
    },
    {
      name: 'test-hook-2',
      type: 'post-step-execute',
      enabled: true,
      priority: 50,
      config: {
        check_outputs: true,
        required_sections: ['summary', 'details']
      }
    },
    {
      name: 'disabled-hook',
      type: 'pre-completion',
      enabled: false,
      priority: 75,
      config: {}
    }
  ]
};

export const mockWorkflowContext = {
  workflow_name: 'test-workflow',
  config: {
    project_name: 'Test Project',
    user_name: 'Test User',
    output_folder: '/test/output'
  },
  variables: {
    var1: 'value1',
    var2: 'value2'
  },
  state: {
    current_step: 1,
    total_steps: 5
  },
  metadata: {
    timestamp: '2025-11-02T00:00:00Z',
    agent_name: 'test-agent'
  }
};

export const mockStepData = {
  step_number: 2,
  step_title: 'Test Step',
  step_goal: 'Test step execution',
  inputs: {
    input1: 'test input'
  },
  outputs: {
    output1: 'test output'
  },
  status: 'completed'
};

export const mockHookResponse = {
  success: {
    status: 'continue',
    message: 'Hook executed successfully',
    modifications: {},
    telemetry: {
      execution_time_ms: 10,
      hook_name: 'test-hook'
    }
  },
  warning: {
    status: 'warn',
    message: 'Hook detected issues but continuing',
    modifications: {},
    telemetry: {
      execution_time_ms: 15,
      hook_name: 'test-hook',
      warnings: ['Warning 1', 'Warning 2']
    }
  },
  halt: {
    status: 'halt',
    message: 'Critical issue detected - stopping workflow',
    modifications: {},
    telemetry: {
      execution_time_ms: 5,
      hook_name: 'test-hook',
      errors: ['Error 1']
    }
  }
};

export const mockEcosystemRules = {
  naming_conventions: {
    files: 'kebab-case',
    variables: 'camelCase',
    constants: 'SCREAMING_SNAKE_CASE'
  },
  documentation_requirements: {
    required_sections: ['summary', 'description', 'examples'],
    min_length: 100
  },
  validation_rules: {
    no_placeholders: true,
    all_variables_resolved: true,
    no_empty_outputs: true
  }
};

export const createMockHook = (overrides = {}) => ({
  name: 'mock-hook',
  type: 'pre-workflow-init',
  enabled: true,
  priority: 100,
  config: {},
  execute: vi.fn().mockResolvedValue(mockHookResponse.success),
  ...overrides
});

export const createMockWorkflowContext = (overrides = {}) => ({
  ...mockWorkflowContext,
  ...overrides
});

export const createMockStepData = (overrides = {}) => ({
  ...mockStepData,
  ...overrides
});
