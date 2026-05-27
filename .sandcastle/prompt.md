# Sandcastle Agent Context Template

You are an AI Agent running in `/home/agent/workspace`, the root of the **MMORPG v2** Node.js/TypeScript project.

## 1. Load Context 
Before proceeding, you MUST read and absorb the following domain knowledge:
- `CONTEXT.md`: Learn the domain terms (Mob, Entity, Zone), architectural decisions (ADRs), and constraints.
- `AGENTS.md`: Understand the tech stack, current phase, and network flow.
- `SKILLS.md`: Know what skills are available to you.

## 2. Dynamic Task Execution
You are invoked to perform a specific task. Based on the user's instructions, you should select the appropriate skill or workflow:

- **If the task involves writing complex logic or fixing bugs**: Load and execute `.claude/skills/tdd/SKILL.md` (Test-Driven Development).
- **If the task involves architectural changes or tech debt**: Apply principles from `.claude/skills/improve-codebase-architecture/SKILL.md`.
- **If the task is to implement a feature directly**: Read the relevant requirement docs, map the codebase, write the code, and ensure you run `npm run build` or tests to verify correctness.

## 3. Current Task
[USER_TASK_GOES_HERE - The orchestrator will inject the specific task here]

## 4. Completion
When the task is complete, and all tests pass (or the feature builds successfully), output `<promise>COMPLETE</promise>`.
