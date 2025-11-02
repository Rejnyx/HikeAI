# Specification: {{feature_name}}

**Version:** 1.0
**Status:** Ready for Architecture Phase
**Epic:** {{epic_name}}
**Council Decision:** {{discussion_id}}

---

## 1. Executive Summary

### Problem Statement

{{problem_statement}}

### Solution Overview

{{solution_overview}}

### Expected Outcome

{{expected_outcome}}

---

## 2. Council Decision

**Decision Date:** {{decision_date}}
**Consensus Level:** {{consensus_level}}%
**Participants:**
{{for each participant}}
- {{icon}} {{displayName}} ({{title}})
{{end}}

**Key Decision:**
> {{key_decision}}

**Rationale:**
{{decision_rationale}}

[Full discussion transcript]({{discussion_file_path}})

---

## 3. Requirements

### 3.1 Functional Requirements

{{for each functional_requirement}}
#### FR-{{index}}: {{requirement_title}}

**Description:**
{{requirement_description}}

**Source:** {{source_agent}} ({{agent_rationale}})

**Acceptance Criteria:**
{{for each criterion}}
- {{criterion}}
{{end}}

**Priority:** {{priority}}

---
{{end}}

### 3.2 Non-Functional Requirements

{{for each nfr}}
#### NFR-{{index}}: {{nfr_title}}

**Description:**
{{nfr_description}}

**Metric:** {{metric}}
**Target:** {{target_value}}
**Source:** {{source_agent}}

---
{{end}}

---

## 4. Technical Approach

### 4.1 Proposed Architecture

{{architectural_approach}}

**Key Components:**
{{for each component}}
- **{{component_name}}**
  Purpose: {{component_purpose}}
  Technology: {{technology}}
{{end}}

### 4.2 Data Model Changes

{{if has_database_changes}}
**New Tables:**
{{for each new_table}}
- `{{table_name}}`
  {{table_schema}}
{{end}}

**Schema Modifications:**
{{for each modification}}
- {{modification}}
{{end}}
{{else}}
No database changes required.
{{endif}}

### 4.3 API Changes

{{if has_api_changes}}
**New Endpoints:**
{{for each endpoint}}
- `{{method}} {{path}}`
  Purpose: {{purpose}}
  Request: {{request_schema}}
  Response: {{response_schema}}
{{end}}

**Modified Endpoints:**
{{for each modified}}
- {{endpoint_path}} - {{modification_description}}
{{end}}
{{else}}
No API changes required.
{{endif}}

### 4.4 Dependencies & Integrations

{{for each dependency}}
- **{{dependency_name}}**
  Type: {{dependency_type}}
  Reason: {{reason}}
  Risk: {{risk_level}}
{{end}}

---

## 5. User Experience

### 5.1 User Journey

{{user_journey_description}}

**Steps:**
{{for each step}}
1. {{step_description}}
   Expected behavior: {{behavior}}
{{end}}

### 5.2 UI Changes

{{if has_ui_changes}}
**New Screens:**
{{for each new_screen}}
- {{screen_name}}
  Purpose: {{purpose}}
  Key elements: {{elements}}
{{end}}

**Modified Screens:**
{{for each modified_screen}}
- {{screen_name}} - {{modification}}
{{end}}

**Design Notes (from {{ux_designer}}):**
{{ux_notes}}
{{else}}
No UI changes required.
{{endif}}

---

## 6. Implementation Scope

### 6.1 MVP (Phase 1)

**In Scope:**
{{for each mvp_feature}}
- {{feature}}
  Justification: {{justification}}
{{end}}

**Out of Scope (Future Phases):**
{{for each future_feature}}
- {{feature}}
  Deferred because: {{reason}}
{{end}}

### 6.2 Estimated Effort

**Complexity:** {{complexity_level}}
**Estimated Story Points:** {{story_points}}
**Suggested Sprint Allocation:** {{sprint_count}} sprints

**Breakdown:**
{{for each component_effort}}
- {{component}}: {{effort}} SP
{{end}}

---

## 7. Testing Strategy

### 7.1 Test Approach (from {{test_architect}})

{{test_approach}}

### 7.2 Test Coverage

**Unit Tests:**
{{for each unit_test_area}}
- {{area}} - {{coverage_target}}%
{{end}}

**Integration Tests:**
{{for each integration_test}}
- {{test_scenario}}
{{end}}

**E2E Tests:**
{{for each e2e_test}}
- {{test_scenario}}
{{end}}

### 7.3 Quality Gates

{{for each quality_gate}}
- {{gate_name}}: {{criteria}}
{{end}}

---

## 8. Risks & Mitigation

{{for each risk}}
### Risk {{index}}: {{risk_title}}

**Severity:** {{severity}}
**Probability:** {{probability}}
**Impact:** {{impact}}

**Description:**
{{risk_description}}

**Mitigation Strategy:**
{{mitigation_strategy}}

**Owner:** {{risk_owner}}

---
{{end}}

---

## 9. Open Questions

{{if has_open_questions}}
{{for each question}}
### Q{{index}}: {{question}}

**Context:** {{context}}
**Blocking:** {{is_blocking}}
**Needs input from:** {{required_input}}
**Target resolution:** {{target_date}}

---
{{end}}
{{else}}
No open questions. Specification is complete.
{{endif}}

---

## 10. Success Metrics

### 10.1 Success Criteria

{{for each success_criterion}}
- {{criterion}}
  Metric: {{metric}}
  Target: {{target}}
  Measurement: {{how_to_measure}}
{{end}}

### 10.2 Monitoring & Analytics

{{monitoring_approach}}

---

## 11. Next Steps

### 11.1 Immediate Actions

1. **Architecture Design** - Owner: {{architect}}
   Run: `/bmad:bmm:workflows:architecture`

2. **UX Design** - Owner: {{ux_designer}}
   {{if needs_ux_workflow}}Run: `/bmad:bmm:workflows:create-ux-design`{{endif}}

3. **Technical Specification** - Owner: {{architect}} + {{pm}}
   Run: `/bmad:bmm:workflows:tech-spec`

### 11.2 Recommended Workflow Path

```
Current Status: ✅ Specification Complete (Rada dokončena)

Next Phase: Architecture & Solutioning
↓
/bmad:bmm:workflows:architecture
↓
/bmad:bmm:workflows:solutioning-gate-check
↓
/bmad:bmm:workflows:sprint-planning
↓
/bmad:bmm:workflows:create-story (for each epic)
↓
/bmad:bmm:workflows:dev-story (implementation)
```

---

## 12. Approvals

**Council Consensus:** {{consensus_level}}% ({{status}})

**Participants Agreement:**
{{for each participant}}
- {{icon}} {{displayName}}: {{agreement_level}}
{{end}}

{{if needs_user_approval}}
⚠️ **User Approval Required:**
{{approval_reason}}
{{else}}
✅ **Ready to Proceed:** Consensus reached, no blocking concerns.
{{endif}}

---

## Appendices

### A. Discussion Transcript

Full autonomous council discussion available at:
[{{discussion_file_path}}]({{discussion_file_path}})

### B. Agent Contributions Summary

{{for each participant}}
**{{displayName}} ({{title}}) Contributions:**
{{for each contribution}}
- {{contribution}}
{{end}}

---
{{end}}

### C. References

{{for each reference}}
- [{{reference_title}}]({{reference_link}})
{{end}}

---

## Document Metadata

**Generated by:** BMAD Autonomous Council
**Workflow:** autonomous-council v1.0
**Template Version:** 1.0
**Generated:** {{timestamp}}
**Language:** {{document_output_language}}

**Council Session:**
- Session ID: {{discussion_id}}
- Topic: {{topic}}
- Duration: {{duration_minutes}} minutes
- Rounds: {{rounds_count}}

---

*This specification was produced through autonomous collaboration of AI experts.*
*Part of the BMAD-S (Symbiotic) development ecosystem.*
