/**
 * Ecosystem Validator Hook
 * Validuje dodržování ekosystémových pravidel v BMAD workflows
 *
 * @module ecosystemValidator
 */

/**
 * Ekosystémová pravidla
 */
const ECOSYSTEM_RULES = {
  // Placeholder validation
  no_placeholders: {
    enabled: true,
    patterns: [
      /\{\{[^}]+\}\}/g,  // {{placeholder}}
      /\$\{[^}]+\}/g,    // ${placeholder}
      /TODO:/gi,         // TODO comments
      /FIXME:/gi,        // FIXME comments
      /XXX:/gi           // XXX markers
    ],
    severity: 'halt'
  },

  // Variable resolution
  all_variables_resolved: {
    enabled: true,
    patterns: [
      /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g  // {variable_name}
    ],
    severity: 'warn'
  },

  // Documentation requirements
  documentation_compliance: {
    enabled: true,
    required_sections: ['summary', 'description'],
    min_length: 50,
    severity: 'warn'
  },

  // Empty outputs
  no_empty_outputs: {
    enabled: true,
    severity: 'warn'
  }
};

/**
 * Vytvoří ecosystem validator hook
 *
 * @param {Object} config - Konfigurace validátoru
 * @returns {Object} Hook object
 */
export function createEcosystemValidator(config = {}) {
  // Deep merge rules - merge each rule individually to preserve patterns
  const rules = { ...ECOSYSTEM_RULES };

  if (config.rules) {
    for (const ruleName in config.rules) {
      if (rules[ruleName]) {
        // Merge rule properties while preserving patterns and other defaults
        rules[ruleName] = {
          ...rules[ruleName],
          ...config.rules[ruleName]
        };
      } else {
        // New rule from config
        rules[ruleName] = config.rules[ruleName];
      }
    }
  }

  return {
    name: config.name || 'ecosystem-validator',
    type: config.type || 'pre-completion',
    enabled: config.enabled !== false,
    priority: config.priority || 75,
    config: rules,

    /**
     * Execute validation
     */
    execute: async (context, stepData) => {
      const startTime = Date.now();
      const violations = [];
      const warnings = [];

      // Rule 1: No placeholders
      if (rules.no_placeholders.enabled) {
        const placeholderViolations = checkPlaceholders(context, stepData, rules.no_placeholders);
        if (placeholderViolations.length > 0) {
          if (rules.no_placeholders.severity === 'halt') {
            violations.push(...placeholderViolations);
          } else {
            warnings.push(...placeholderViolations);
          }
        }
      }

      // Rule 2: All variables resolved
      if (rules.all_variables_resolved.enabled) {
        const unresolvedVars = checkUnresolvedVariables(context, rules.all_variables_resolved);
        if (unresolvedVars.length > 0) {
          if (rules.all_variables_resolved.severity === 'halt') {
            violations.push(...unresolvedVars);
          } else {
            warnings.push(...unresolvedVars);
          }
        }
      }

      // Rule 3: Documentation compliance
      if (rules.documentation_compliance.enabled && stepData) {
        const docIssues = checkDocumentationCompliance(stepData, rules.documentation_compliance);
        if (docIssues.length > 0) {
          if (rules.documentation_compliance.severity === 'halt') {
            violations.push(...docIssues);
          } else {
            warnings.push(...docIssues);
          }
        }
      }

      // Rule 4: No empty outputs
      if (rules.no_empty_outputs.enabled && stepData && stepData.outputs) {
        const emptyOutputs = checkEmptyOutputs(stepData.outputs);
        if (emptyOutputs.length > 0) {
          if (rules.no_empty_outputs.severity === 'halt') {
            violations.push(...emptyOutputs);
          } else {
            warnings.push(...emptyOutputs);
          }
        }
      }

      // Determine status
      let status = 'continue';
      let message = 'Ekosystémová validace úspěšná';

      if (violations.length > 0) {
        status = 'halt';
        message = `Zjištěno ${violations.length} kritických porušení ekosystémových pravidel`;
      } else if (warnings.length > 0) {
        status = 'warn';
        message = `Zjištěno ${warnings.length} varování v ekosystémových pravidlech`;
      }

      return {
        status,
        message,
        violations,
        warnings,
        modifications: {},
        telemetry: {
          execution_time_ms: Date.now() - startTime,
          rules_checked: Object.keys(rules).filter(k => rules[k].enabled).length,
          violations_count: violations.length,
          warnings_count: warnings.length
        }
      };
    }
  };
}

/**
 * Kontrola placeholderů
 */
function checkPlaceholders(context, stepData, rule) {
  const violations = [];

  // Check context variables
  const contextStr = JSON.stringify(context.variables || {});
  for (const pattern of rule.patterns) {
    const matches = contextStr.match(pattern);
    if (matches && matches.length > 0) {
      violations.push({
        rule: 'no_placeholders',
        location: 'context.variables',
        matches: [...new Set(matches)],
        message: `Nalezeny nenahrazené placeholdery: ${matches.join(', ')}`
      });
    }
  }

  // Check context outputs (pre-completion hooks)
  if (context.outputs) {
    const outputStr = JSON.stringify(context.outputs);
    for (const pattern of rule.patterns) {
      const matches = outputStr.match(pattern);
      if (matches && matches.length > 0) {
        violations.push({
          rule: 'no_placeholders',
          location: 'context.outputs',
          matches: [...new Set(matches)],
          message: `Výstup obsahuje placeholdery: ${matches.join(', ')}`
        });
      }
    }
  }

  // Check step data outputs (post-step hooks)
  if (stepData && stepData.outputs) {
    const outputStr = JSON.stringify(stepData.outputs);
    for (const pattern of rule.patterns) {
      const matches = outputStr.match(pattern);
      if (matches && matches.length > 0) {
        violations.push({
          rule: 'no_placeholders',
          location: 'stepData.outputs',
          matches: [...new Set(matches)],
          message: `Výstup obsahuje placeholdery: ${matches.join(', ')}`
        });
      }
    }
  }

  return violations;
}

/**
 * Kontrola nevyřešených proměnných
 */
function checkUnresolvedVariables(context, rule) {
  const violations = [];

  if (!context.variables) {
    return violations;
  }

  const varsStr = JSON.stringify(context.variables);
  for (const pattern of rule.patterns) {
    const matches = varsStr.match(pattern);
    if (matches && matches.length > 0) {
      violations.push({
        rule: 'all_variables_resolved',
        location: 'context.variables',
        matches: [...new Set(matches)],
        message: `Nevyřešené proměnné: ${matches.join(', ')}`
      });
    }
  }

  return violations;
}

/**
 * Kontrola dokumentační compliance
 */
function checkDocumentationCompliance(stepData, rule) {
  const violations = [];

  if (!stepData.outputs || typeof stepData.outputs !== 'object') {
    return violations;
  }

  // Check for required sections
  for (const section of rule.required_sections) {
    if (!stepData.outputs[section]) {
      violations.push({
        rule: 'documentation_compliance',
        location: `stepData.outputs.${section}`,
        message: `Chybí požadovaná sekce: ${section}`
      });
    }
  }

  // Check minimum length
  const combinedText = Object.values(stepData.outputs)
    .filter(v => typeof v === 'string')
    .join(' ');

  if (combinedText.length < rule.min_length) {
    violations.push({
      rule: 'documentation_compliance',
      location: 'stepData.outputs',
      message: `Dokumentace je příliš krátká (${combinedText.length} znaků, minimum: ${rule.min_length})`
    });
  }

  return violations;
}

/**
 * Kontrola prázdných výstupů
 */
function checkEmptyOutputs(outputs) {
  const violations = [];

  for (const [key, value] of Object.entries(outputs)) {
    if (value === null || value === undefined || value === '') {
      violations.push({
        rule: 'no_empty_outputs',
        location: `outputs.${key}`,
        message: `Prázdný výstup: ${key}`
      });
    }
  }

  return violations;
}

/**
 * Export default validator
 */
export default createEcosystemValidator;
