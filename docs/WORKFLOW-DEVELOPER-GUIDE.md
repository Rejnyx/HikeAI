# BMAD Workflow Developer Guide

**Version:** 1.0.0
**Target Audience:** Workflow Developers, Contributors
**Last Updated:** 2025-11-02

---

## 📚 Obsah

1. [Úvod](#úvod)
2. [Workflow Anatomy](#workflow-anatomy)
3. [Hooks Integration](#hooks-integration)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Úvod

Tento guide tě naučí vytvářet BMAD workflows s **hooks podporou** pro automatickou quality control a telemetrii.

### Co Se Naučíš

✅ Jak strukturovat workflow.yaml
✅ Jak povolit hooks pro quality gates
✅ Jak testovat workflows
✅ Best practices pro produkční workflows

---

## Workflow Anatomy

### Základní Struktura

```yaml
# workflow.yaml

# === METADATA ===
name: "my-workflow"
description: "Co workflow dělá"
author: "Tvoje jméno"

# === CONFIGURATION ===
config_source: "{project-root}/bmad/bmm/config.yaml"
output_folder: "{config_source}:output_folder"
user_name: "{config_source}:user_name"

# === HOOKS (IMPORTANT!) ===
hooks_enabled: true
hooks_config: "{project-root}/bmad/core/hooks/hooks.yaml"

# === PATHS ===
installed_path: "{project-root}/bmad/workflows/my-workflow"
instructions: "{installed_path}/instructions.md"
template: "{installed_path}/template.md"

# === OUTPUT ===
default_output_file: "{output_folder}/my-workflow-output.md"

standalone: true
```

---

## Hooks Integration

### Kdy Použít Hooks

✅ **ANO - Use Hooks:**
- Production workflows
- Workflows které generují dokumenty
- Workflows s quality requirements
- Workflows kde chceš telemetry

❌ **NE - Skip Hooks:**
- Quick prototypes
- Development/testing workflows
- Performance-critical workflows

### Jak Povolit Hooks

**Option 1: Default Configuration (Recommended)**

```yaml
# Použije globální hooks z bmad/core/hooks/hooks.yaml
hooks_enabled: true
hooks_config: "{project-root}/bmad/core/hooks/hooks.yaml"
```

**Option 2: Custom Configuration**

```yaml
# Vlastní hooks config pro tento workflow
hooks_enabled: true
hooks_config: "{project-root}/my-custom-hooks.yaml"
```

**Option 3: Disable Hooks**

```yaml
# Explicitně vypnout (nebo jen vynechat)
hooks_enabled: false
```

---

## Development Workflow

### Krok 1: Create Workflow Structure

```bash
bmad/
├── workflows/
│   └── my-workflow/
│       ├── workflow.yaml         # Main config
│       ├── instructions.md       # Step-by-step guide
│       ├── template.md           # Output template
│       └── checklist.md          # Validation checklist
```

### Krok 2: Define workflow.yaml

**Minimal Example:**

```yaml
name: "my-workflow"
description: "Short description"
author: "Your Name"

config_source: "{project-root}/bmad/bmm/config.yaml"
output_folder: "{config_source}:output_folder"

hooks_enabled: true
hooks_config: "{project-root}/bmad/core/hooks/hooks.yaml"

installed_path: "{project-root}/bmad/workflows/my-workflow"
instructions: "{installed_path}/instructions.md"

default_output_file: "{output_folder}/my-workflow-output.md"

standalone: true
```

### Krok 3: Write Instructions

**`instructions.md`:**

```markdown
# My Workflow Instructions

## Step 1: Initialize

<action>Load configuration and validate inputs</action>

## Step 2: Process

<action>Process data according to requirements</action>

## Step 3: Generate Output

<action>Create final output document</action>
<template-output>
Generate the final document content here.
</template-output>
```

### Krok 4: Create Template

**`template.md`:**

```markdown
# {{workflow_name}} - Output

**Generated:** {{date}}
**Author:** {{user_name}}

## Summary

{{summary}}

## Details

{{details}}

## Conclusion

{{conclusion}}
```

### Krok 5: Test Workflow

```javascript
// test-my-workflow.js

import { runWorkflow } from './core/executor/workflowExecutor.js';

const steps = [
  {
    number: 1,
    title: 'Initialize',
    action: async (context) => {
      context.variables.summary = 'Test summary';
      return { outputs: {} };
    }
  },
  {
    number: 2,
    title: 'Generate Output',
    action: async (context) => {
      context.outputs = {
        'output.md': 'Final output content'
      };
      return { outputs: context.outputs };
    }
  }
];

const result = await runWorkflow(
  'bmad/workflows/my-workflow/workflow.yaml',
  steps
);

console.log('Status:', result.status);
console.log('Hooks enabled:', result.hooks_enabled);
console.log('Duration:', result.duration_ms + 'ms');
```

---

## Testing

### Unit Test Your Workflow

**`tests/integration/my-workflow.test.js`:**

```javascript
import { describe, test, expect } from 'vitest';
import { runWorkflow } from '../../core/executor/workflowExecutor.js';

describe('My Workflow', () => {
  test('měl by úspěšně provést workflow S hooks', async () => {
    const steps = createTestSteps();

    const result = await runWorkflow(
      'bmad/workflows/my-workflow/workflow.yaml',
      steps
    );

    expect(result.status).toBe('success');
    expect(result.hooks_enabled).toBe(true);
    expect(result.steps_executed).toBe(2);
  });

  test('měl by detekovat placeholders', async () => {
    const steps = [
      {
        number: 1,
        title: 'Bad Output',
        action: async (context) => {
          context.outputs = {
            'output.md': 'This has {{placeholder}}'
          };
          return { outputs: context.outputs };
        }
      }
    ];

    const result = await runWorkflow(
      'bmad/workflows/my-workflow/workflow.yaml',
      steps
    );

    // Pre-completion hook should halt
    expect(result.status).toBe('error');
    expect(result.error).toContain('Pre-completion hooks halted');
  });
});
```

### Run Tests

```bash
cd bmad
npm test -- tests/integration/my-workflow.test.js
```

---

## Best Practices

### 1. Always Enable Hooks in Production

```yaml
# ✅ GOOD - Production workflow
production-workflow:
  hooks_enabled: true

# ❌ BAD - No quality control
production-workflow:
  hooks_enabled: false
```

### 2. Use Meaningful Names

```yaml
# ✅ GOOD
name: "architecture-design"
default_output_file: "{output_folder}/architecture-design-{{date}}.md"

# ❌ BAD
name: "workflow1"
default_output_file: "{output_folder}/output.md"
```

### 3. Provide Clear Descriptions

```yaml
# ✅ GOOD
description: "Collaborative architectural decision facilitation for AI-agent consistency"

# ❌ BAD
description: "Architecture stuff"
```

### 4. Use Template Variables

```yaml
# Variables from config
user_name: "{config_source}:user_name"
output_folder: "{config_source}:output_folder"

# System variables
date: system-generated

# Custom variables
project_name: "{config_source}:project_name"
```

### 5. Test Before Committing

```bash
# Run workflow tests
npm test -- tests/integration/

# Check hooks are enabled
grep -r "hooks_enabled: true" bmad/workflows/
```

### 6. Document Your Workflow

```yaml
# Add comments to explain complex logic
# === HOOKS CONFIGURATION ===
# Using strict validation for architecture documents
hooks_enabled: true
hooks_config: "{project-root}/strict-hooks.yaml"
```

---

## Examples

### Example 1: Simple Documentation Workflow

**`workflow.yaml`:**

```yaml
name: "documentation-generator"
description: "Generates project documentation"
author: "BMAD"

config_source: "{project-root}/bmad/bmm/config.yaml"
output_folder: "{config_source}:output_folder"

hooks_enabled: true
hooks_config: "{project-root}/bmad/core/hooks/hooks.yaml"

installed_path: "{project-root}/bmad/workflows/documentation"
instructions: "{installed_path}/instructions.md"
template: "{installed_path}/template.md"

default_output_file: "{output_folder}/documentation-{{date}}.md"

standalone: true
```

**Benefits:**
- ✅ Placeholders automatically detected
- ✅ Empty outputs prevented
- ✅ Telemetry collected

### Example 2: Workflow S Custom Validation

**`strict-hooks.yaml`:**

```yaml
hooks:
  - name: ecosystem-validator-completion
    type: pre-completion
    enabled: true
    priority: 100
    config:
      rules:
        no_placeholders:
          enabled: true
          severity: halt
        documentation_compliance:
          enabled: true
          severity: halt
          required_sections:
            - summary
            - technical_details
            - testing_strategy
            - deployment_plan
          min_length: 500
```

**`workflow.yaml`:**

```yaml
name: "production-architecture"
description: "Production-grade architecture design"

# ... config ...

hooks_enabled: true
hooks_config: "{project-root}/strict-hooks.yaml"  # Custom hooks!
```

**Benefits:**
- ✅ Stricter validation
- ✅ Required sections enforced
- ✅ Minimum content length

### Example 3: Performance-Critical Workflow

**`workflow.yaml`:**

```yaml
name: "batch-processor"
description: "High-performance batch processing"

# ... config ...

# Disable hooks for maximum performance
hooks_enabled: false
```

**Use Case:**
- Batch processing workflows
- Performance benchmarks
- Development/testing

---

## Migration Checklist

Migrating existing workflow to hooks:

- [ ] Add `hooks_enabled: true` to workflow.yaml
- [ ] Add `hooks_config` path
- [ ] Test workflow with hooks enabled
- [ ] Fix any placeholder violations
- [ ] Run regression tests
- [ ] Update workflow documentation
- [ ] Commit changes

---

## Troubleshooting

### Problem: Hooks Not Running

**Check:**
```yaml
# Is this set?
hooks_enabled: true
hooks_config: "{project-root}/bmad/core/hooks/hooks.yaml"
```

**Verify:**
```javascript
const result = await runWorkflow(...);
console.log('Hooks enabled:', result.hooks_enabled);
```

### Problem: Workflow Halted Unexpectedly

**Cause:** Pre-completion hook found violations

**Fix:**
1. Check error message
2. Fix placeholders in outputs
3. Or change severity to `warn`

```bash
# Check for placeholders
grep -r "{{" output_folder/
grep -r "TODO:" output_folder/
```

### Problem: Slow Performance

**Measure:**
```javascript
console.log('Duration:', result.duration_ms);
console.log('Telemetry:', result.context.telemetry);
```

**Solutions:**
- Disable hooks for development: `hooks_enabled: false`
- Use custom hooks with fewer rules
- Optimize step actions

---

## Reference

### Workflow.yaml Schema

```yaml
# Required
name: string
description: string

# Configuration
config_source: path
output_folder: path
user_name: variable

# Hooks
hooks_enabled: boolean
hooks_config: path

# Paths
installed_path: path
instructions: path
template: path (optional)
validation: path (optional)

# Output
default_output_file: path

# Metadata
standalone: boolean
author: string (optional)
version: string (optional)
```

### Hook Types Reference

```yaml
pre-workflow-init:     Before workflow initialization
post-workflow-init:    After workflow initialization
pre-step-execute:      Before each step
post-step-execute:     After each step
pre-completion:        Before workflow completion
post-completion:       After workflow completion
on-error:              When error occurs
```

---

## Resources

**Documentation:**
- [Hooks Usage Guide](HOOKS-USAGE-GUIDE.md)
- [Implementation Report](HOOKS-IMPLEMENTATION-REPORT.md)
- [E2E Test Report](E2E-ECOSYSTEM-TEST-COMPLETE.md)

**Examples:**
- Brainstorming: `bmad/core/workflows/brainstorming/workflow.yaml`
- Architecture: `bmad/bmm/workflows/3-solutioning/architecture/workflow.yaml`

**Tests:**
- E2E Example: `bmad/tests/e2e/workflow-hooks.e2e.test.js`

---

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Tested:** 239/239 tests passing

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**
