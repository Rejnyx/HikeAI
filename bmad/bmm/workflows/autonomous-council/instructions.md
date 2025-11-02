# Autonomous Council - Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.xml</critical>
<critical>This workflow orchestrates AUTONOMOUS multi-agent decision-making WITHOUT user intervention during discussion</critical>

## Vision

This workflow implements the **"Rada AI Agentů" (AI Council)** vision from BMAD-S, enabling autonomous collaboration between specialized AI agents to make strategic decisions and produce specification documents.

## Key Principles

1. **Autonomy**: Agents discuss WITHOUT user prompts between rounds
2. **Structured**: Each discussion follows a clear goal-oriented path
3. **Time-boxed**: Maximum {{max_rounds}} rounds to maintain focus
4. **Consensus-driven**: Decision emerges from expert agreement
5. **Actionable**: Produces concrete specification document

---

<workflow>

<step n="1" goal="Initialize Council Session">
  <action>Receive topic from user: "{{user_topic}}"</action>
  <action>Parse and understand the request</action>
  <action>Create discussion_id: UUID</action>
  <action>Create topic_slug: kebab-case version of topic</action>
  <action>Set session variables:</action>
    - discussion_id
    - topic: {{user_topic}}
    - topic_slug
    - current_round: 0
    - status: INITIALIZING
    - timestamp_start: now()

  <action>Announce council activation:</action>
  <format>
    🎭 **RADA AI AGENTŮ SVOLÁNA**

    **Téma:** {{topic}}
    **Session ID:** {{discussion_id}}
    **Datum:** {{timestamp_start}}

    Sophia (Council Facilitator) začíná autonomní diskuzi...
  </format>
</step>

<step n="2" goal="Load Agent Ecosystem">
  <action>Load agent manifest from {{agent_manifest}}</action>
  <action>Parse CSV to extract all agents with their properties</action>
  <action>For each agent, check for customization overrides at {{agent_overrides}}</action>
  <action>Merge override data (overrides take precedence)</action>
  <action>Store complete agent roster in memory</action>
</step>

<step n="3" goal="Select Relevant Participants">
  <action>Sophia analyzes topic: "{{topic}}"</action>
  <action>Identify required expertise based on topic keywords:</action>
    - "achievement|feature|product" → pm, ux-designer, analyst
    - "architecture|technical|API|database" → architect, dev, tea
    - "game|mechanics|gameplay" → game-designer, game-architect, game-dev
    - "user|experience|interface" → ux-designer, analyst
    - "testing|quality|performance" → tea, architect

  <action>Select {{min_participants}} to {{max_participants}} most relevant agents</action>
  <note>Always include at least: analyst (Mary) OR pm (John) for requirements perspective</note>
  <note>Always include architect (Winston) for technical feasibility</note>

  <action>Announce participants:</action>
  <format>
    **Sophia:** Na základě tématu "{{topic}}" svolávám následující experty:

    {{for each selected_agent}}
    - {{agent.icon}} **{{agent.displayName}}** ({{agent.title}})
      Expertise: {{agent.role}}
    {{end}}

    Začínáme autonomní diskuzi...
  </format>
</step>

<step n="4" goal="Autonomous Discussion Loop" repeat="until_exit_condition">
  <action>Increment current_round</action>
  <action>Set status: IN_DISCUSSION</action>

  <substep n="4a" goal="Round Announcement">
    <action>Sophia announces round:</action>
    <format>
    ---
    ## Round {{current_round}}/{{max_rounds}}

    **Focus:** {{determine_round_focus}}
    </format>

    <determine_round_focus>
      Round 1: Problem understanding & requirements clarification
      Round 2: Technical approach & architecture
      Round 3: Implementation considerations & risks
      Round 4+: Refinement, consensus building, details
    </determine_round_focus>
  </substep>

  <substep n="4b" goal="Agent Contributions - NO USER INPUT">
    <critical>This is FULLY AUTONOMOUS - agents speak WITHOUT waiting for user</critical>

    <action>For each selected agent in logical order:</action>

    <order>
      1. Analyst/PM: Requirements & business value
      2. UX Designer (if selected): User experience perspective
      3. Architect: Technical approach & feasibility
      4. Developer/TEA: Implementation & testing considerations
      5. Other specialists based on topic
    </order>

    <action>Each agent provides structured input based on round focus:</action>

    <format>
    **{{agent.displayName}} ({{agent.title}}):**

    {{agent_perspective}}

    **Key points:**
    - {{point_1}}
    - {{point_2}}
    - {{point_3}}

    {{if has_question_for_another_agent}}
    *Question for {{other_agent}}:* {{question}}
    {{endif}}

    {{if has_concern}}
    ⚠️ **Concern:** {{concern_description}}
    {{endif}}

    {{if proposes_decision}}
    ✅ **Proposal:** {{proposal}}
    {{endif}}
    </format>

    <agent_guidelines>
      - Stay in character using agent's communicationStyle
      - Apply agent's principles to the discussion
      - Build on previous comments (cross-talk)
      - Ask clarifying questions to other agents
      - Raise concerns explicitly
      - Propose concrete solutions
      - Be concise but thorough (3-5 key points max)
    </agent_guidelines>
  </substep>

  <substep n="4c" goal="Cross-Talk & Clarifications">
    <action>After all agents speak, allow 1-2 rounds of quick cross-talk:</action>

    <action>If agent A asked agent B a question:</action>
      - Agent B responds directly
      - Keep response focused and brief

    <action>If concerns were raised:</action>
      - Relevant agent addresses the concern
      - Sophia may summarize if needed

    <format>
    **{{responder}}:** @{{questioner}} - {{response}}
    </format>
  </substep>

  <substep n="4d" goal="Sophia Summarizes Round">
    <action>Sophia provides round summary:</action>
    <format>
    **Sophia (Facilitator):**

    **Round {{current_round}} Summary:**

    ✅ **Agreements:**
    - {{agreement_1}}
    - {{agreement_2}}

    {{if has_disagreements}}
    ⚠️ **Open Questions:**
    - {{question_1}}
    - {{question_2}}
    {{endif}}

    {{if has_concerns}}
    🚨 **Unresolved Concerns:**
    - {{concern_1}}
    {{endif}}

    **Status:** {{calculate_consensus_level}}%  toward consensus
    </format>
  </substep>

  <substep n="4e" goal="Check Exit Conditions">
    <check priority="1" condition="consensus_reached">
      <criteria>
        - All major concerns addressed
        - No blocking disagreements
        - Clear decision direction emerged
        - Consensus level ≥ {{consensus_threshold}}
      </criteria>
      <action if="true">Set status: CONSENSUS_REACHED</action>
      <action if="true">GOTO step 5</action>
    </check>

    <check priority="2" condition="max_rounds_exceeded">
      <criteria>current_round ≥ {{max_rounds}}</criteria>
      <action if="true">Set status: MAX_ROUNDS_EXCEEDED</action>
      <action if="true">Sophia announces: "Reached maximum discussion rounds. Moving to best available decision."</action>
      <action if="true">GOTO step 5</action>
    </check>

    <check priority="3" condition="deadlock_detected">
      <criteria>
        - Same concerns repeated in 3+ rounds
        - Consensus level not improving
        - Fundamental disagreement on approach
      </criteria>
      <action if="true">Set status: ESCALATION_REQUIRED</action>
      <action if="true">Sophia announces: "Deadlock detected. Escalating to user for direction."</action>
      <action if="true">Ask user to choose between alternatives</action>
      <action if="true">GOTO step 5</action>
    </check>

    <check priority="4" condition="continue_discussion">
      <action>Sophia announces: "Continuing to next round..."</action>
      <action>REPEAT step 4 (new round)</action>
    </check>
  </substep>
</step>

<step n="5" goal="Generate Decision Document">
  <action>Sophia announces: "Generuji rozhodnutí..."</action>

  <action>Create discussion transcript:</action>
    - Save complete discussion to {{default_discussion_file}}
    - Include all rounds, all agent contributions
    - Include final consensus status

  <action>Create specification document:</action>
    - Use template from {{spec_template}}
    - Populate with decisions made during discussion
    - Include rationale from agent arguments
    - List participants and their contributions
    - Save to {{default_spec_file}}

  <action>Update PRODUCT-ROADMAP.md if exists:</action>
    - Add new feature/epic to roadmap
    - Status: "Specifikace připravena"
    - Link to specification document
</step>

<step n="6" goal="Present Results to User">
  <action>Sophia presents final output:</action>
  <format>
  🎭 **RADA AI AGENTŮ - ROZHODNUTÍ**

  **Téma:** {{topic}}
  **Status:** {{status}}
  **Rounds:** {{current_round}}/{{max_rounds}}
  **Konsenzus:** {{final_consensus_level}}%

  **Účastníci:**
  {{for each participant}}
  - {{icon}} {{displayName}}
  {{end}}

  **Hlavní rozhodnutí:**
  {{key_decision_summary}}

  **Vytvořené dokumenty:**
  1. 📝 Diskuzní zápis: {{discussion_file_path}}
  2. 📋 Specifikace: {{spec_file_path}}

  {{if roadmap_updated}}
  3. 🗺️ Roadmap aktualizována
  {{endif}}

  **Další kroky:**
  {{recommended_next_steps}}

  ---

  Rada dokončena. Můžete pokračovat implementací pomocí:
  `/bmad:bmm:workflows:architecture` (Fáze 3: Architektura)
  nebo
  `/bmad:bmm:workflows:sprint-planning` (Fáze 4: Implementace)
  </format>
</step>

</workflow>

---

## Decision Quality Guidelines

<quality-criteria>
  <criterion name="Clarity">Decision is unambiguous and actionable</criterion>
  <criterion name="Feasibility">Technical approach is validated by architect</criterion>
  <criterion name="User-Centered">UX considerations addressed</criterion>
  <criterion name="Testable">TEA can define test strategy</criterion>
  <criterion name="Scoped">MVP version clearly defined</criterion>
  <criterion name="Documented">Rationale captured for future reference</criterion>
</quality-criteria>

## Agent Interaction Patterns

<patterns>
  <pattern name="Challenge & Refine">
    Agent A proposes → Agent B identifies issue → Agent A refines → Consensus
  </pattern>

  <pattern name="Build On">
    Agent A suggests approach → Agent B adds enhancement → Agent C validates
  </pattern>

  <pattern name="Diverge & Converge">
    Multiple agents propose alternatives → Discuss tradeoffs → Select best
  </pattern>

  <pattern name="Escalate">
    Agents cannot agree → Sophia summarizes options → User decides
  </pattern>
</patterns>

## Success Metrics

<metrics>
  <metric>Time to consensus: Target {{max_rounds/2}} rounds</metric>
  <metric>Specification completeness: All template sections filled</metric>
  <metric>Cross-functional input: All selected agents contributed</metric>
  <metric>Actionability: Clear next steps defined</metric>
</metrics>

---

## Notes for Facilitator (Sophia)

<facilitator-notes>
  - Maintain neutral tone - no favoritism toward any agent
  - Keep discussion focused on the topic
  - Detect when agents are repeating themselves → push for resolution
  - Celebrate progress and agreement
  - Acknowledge concerns seriously
  - If discussion veers off-topic, redirect gently
  - Watch for power dynamics (e.g., architect overruling UX) → balance
  - Time-box effectively - quality over completeness
</facilitator-notes>
