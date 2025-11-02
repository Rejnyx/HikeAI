/**
 * Workflow Test Fixtures
 * Mockové workflow konfigurace pro testování
 */

export const simpleWorkflowYaml = {
  name: 'simple-test-workflow',
  description: 'Simple workflow for testing',
  config_source: '{project-root}/bmad/bmm/config.yaml',
  output_folder: '{config_source}:output_folder',
  instructions: 'inline',
  steps: [
    {
      number: 1,
      goal: 'Test step 1',
      actions: ['Action 1', 'Action 2']
    },
    {
      number: 2,
      goal: 'Test step 2',
      actions: ['Action 3']
    }
  ]
};

export const complexWorkflowYaml = {
  name: 'complex-test-workflow',
  description: 'Complex workflow with hooks',
  config_source: '{project-root}/bmad/bmm/config.yaml',
  output_folder: '{config_source}:output_folder',
  hooks_enabled: true,
  hooks_config: '{project-root}/bmad/core/hooks/hooks.yaml',
  instructions: '{installed_path}/instructions.md',
  template: '{installed_path}/template.md',
  validation: '{installed_path}/checklist.md',
  default_output_file: '{output_folder}/test-output.md'
};

export const mockWorkflowEngine = {
  loadWorkflow: vi.fn(),
  executeStep: vi.fn(),
  saveOutput: vi.fn(),
  validate: vi.fn()
};

export const mockInstructions = `
# Test Workflow Instructions

<step n="1" goal="Initialize">
  <action>Load configuration</action>
  <action>Initialize context</action>
</step>

<step n="2" goal="Process">
  <action>Process data</action>
  <template-output>results</template-output>
</step>

<step n="3" goal="Complete">
  <action>Validate results</action>
  <action>Save output</action>
</step>
`;

export const mockTemplate = `
# Test Output Template

## Summary
{{summary_placeholder}}

## Details
{{details_placeholder}}

## Results
{{results_placeholder}}
`;
