# Skill: Context-First Execution

> **Type:** Pandora Todo List Skill  
> **Stack:** .NET 10, React 19, Python MCP, PostgreSQL  
> **When to use:** Implement work items with full project context awareness; decompose complex tasks into sub-tasks; track implementation branches

---

## What It Is

The **context-first execution skill** is a structured workflow for AI agents implementing Pandora Todo List work items. It ensures that before writing any code, agents:

1. Scan the current project state
2. Review relevant knowledge (wiki, checkpoints)
3. Load backlog context (tags, wiki refs, constraints)
4. Execute the task with sub-task decomposition
5. Validate and record learnings

This skill powers the `pandora_context_first_execute` MCP prompt and enables agents to make informed decisions without losing context between sessions.

---

## Key Features Enabled

### Recursive Sub-Tasks
- Create unlimited-depth task hierarchies via `workitem_add_subtask` MCP tool
- Parent work items auto-complete when all children are Done
- Prevents orphaned tasks; improves task tracking granularity
- Example: Feature → Sub-feature → Bug → Fix

### Branch Tracking
- Associate git branches with individual work items via `branch` field in `workitem_update`
- Track implementation progress across branches
- Frontend displays branch on kanban cards
- Enables correlation between Pandora tasks and git commits

### Context-First Backlog Enrichment
- Annotate backlog items with `tags`, `wikiRefs`, and `constraints` via `backlog_context_update`
- **Tags:** Classification metadata (ex: "auth", "performance", "bug-fix")
- **WikiRefs:** Links to relevant knowledge pages
- **Constraints:** Non-functional requirements and design restrictions
- Agents read this context before implementation to avoid rework

---

## 5-Step Workflow

### Step 1: Discovery
**Goal:** Understand current project state without assumptions

- **API Call:** `GET /api/projects/{projectId}/dashboard`
- **MCP Resource:** `pandora://projects/{projectId}/context`
- **Actions:**
  - Read active sprint(s)
  - List work items by status (Todo, InProgress, Review, Done)
  - Check recent commits/branches

**Why:** Prevents duplicating work; identifies blockers; reveals ongoing efforts

### Step 2: Knowledge Warm-Up
**Goal:** Load relevant context from project knowledge base

- **MCP Resource:** `pandora://projects/{projectId}/knowledge`
- **Actions:**
  - Read recent wiki pages
  - Review checkpoints from previous sprints
  - Check technical decisions recorded
  - Identify patterns in constraints

**Why:** Builds on previous learning; avoids contradicting past decisions; accelerates onboarding

### Step 3: Context Injection
**Goal:** Load backlog item metadata and confirm work plan

- **MCP Tool:** `backlog_list` → extract `tags`, `wikiRefs`, `constraints` for this backlog item
- **API Call:** `GET /api/projects/{projectId}/config` → confirm `mainBranch`, `localPath`, `techStack`
- **Decisions:**
  - Is this task complex enough to decompose into sub-tasks?
  - Which branch should I work on?
  - Are there wiki references I must study first?
  - What are the hard constraints (performance, compatibility)?

**Why:** Ensures implementation aligns with project vision; reduces scope creep; enables parallel work via branching

### Step 4: Execution
**Goal:** Implement the work item with cognitive state maintenance

- **MCP Tool:** `workitem_update(status='in_progress', branch='...')`
- **During implementation:**
  - If task split into sub-tasks: `workitem_add_subtask(parent_work_item_id='...', ...)`
  - If new constraints discovered: `backlog_context_update(...)`
  - If learnings are reusable: `wiki_add(...)`
- **On completion:**
  - `workitem_update(status='done', feedback='summary', branch='...')`
  - Commit code to the tracked branch

**Why:** Maintains state in Pandora; enables resumable work; captures learnings; links code to tasks

### Step 5: Validation Review
**Goal:** Verify work quality and completeness

- **Check sub-tasks:** Are all children marked Done? (Parent auto-completes)
- **Verify dashboard:** Does `GET /api/projects/{projectId}/dashboard` reflect new work?
- **Review learnings:** Have wiki pages / checkpoints been updated?
- **Validate no orphans:** Are there any blocked or incomplete sub-tasks left behind?
- **Export state:** `knowledge_checkpoint(...)` if sprint/epic is complete

**Why:** Ensures clean project state; preserves knowledge; prevents manual follow-up work

---

## MCP Tools (Quick Reference)

| Tool | Purpose | When to Use |
|---|---|---|
| `backlog_context_update` | Enrich backlog item metadata | Before sprint planning; during task refinement |
| `workitem_add_subtask` | Create child task | When decomposing complex work |
| `workitem_update` | Mark work item status and branch | Every significant progress event (started, completed, review) |
| `knowledge_checkpoint` | Snapshot project context | End of sprint; major decision points |
| `wiki_add` | Record reusable learnings | After solving novel problems; documenting patterns |

---

## Example: Implementing a Feature Task

### Scenario
Implement authentication module for Pandora dashboard (complex task)

### Context Discovery
```
1. Scan: "Sprint Alpha in progress, 12/15 items done, no blockers"
2. Warm-up: "Previous checkpoint shows auth pattern using JWT"
3. Inject: Tags=[auth, security], WikiRefs=[jwt-pattern, oidc-docs], Constraints=[max 500ms latency, pass OWASP A02]
4. Decision: Decompose into 3 sub-tasks (backend JWT, frontend middleware, integration test)
```

### Execution
```
workitem_update(id=auth-task, status='in_progress', branch='feat/auth-backend')

workitem_add_subtask(parent_id=auth-task, title='JWT token generation', branch='feat/auth-backend')
workitem_add_subtask(parent_id=auth-task, title='React auth provider', branch='feat/auth-frontend')
workitem_add_subtask(parent_id=auth-task, title='E2E auth tests', branch='feat/auth-tests')

[implement each sub-task...]

workitem_update(id=jwt-sub, status='done', feedback='Implemented RS256 signing with 50ms overhead')
workitem_update(id=provider-sub, status='done', feedback='React Context + localStorage for tokens')
workitem_update(id=tests-sub, status='done', feedback='Happy path + expiry + refresh token tests')

[All children Done → Parent auto-completes]
workitem_update(id=auth-task, status='done', feedback='Full auth module complete; see JWT pattern wiki')
```

### Validation
```
✓ All 3 sub-tasks marked Done
✓ Parent auto-completed
✓ 3 feature branches merged to develop
✓ Dashboard shows 13/15 items done in Sprint Alpha
✓ Added wiki page: "JWT Token Management Pattern"
```

---

## Common Patterns

### Pattern: Spike Task (Research)
```
backlog_add(title='Research: API Gateway Options')
workitem_update(status='in_progress', branch='spike/api-gateway-research')
wiki_add(title='API Gateway Evaluation: Kong vs AWS Gateway', content='...')
workitem_update(status='done', feedback='Recommended Kong for self-hosted; wiki updated')
```

### Pattern: Performance Optimization
```
backlog_context_update(backlog_id='perf-task', constraints='target <200ms latency')
workitem_update(status='in_progress', branch='perf/db-indexing')
# [optimize indexes...]
workitem_update(status='review', feedback='Reduced query time from 800ms to 120ms')
workitem_update(status='done', feedback='Performance target achieved')
```

### Pattern: Blocked Task
```
workitem_update(status='blocked', feedback='Waiting for database schema migration from platform team')
# [after dependency resolved...]
workitem_update(status='in_progress', branch='feat/new-schema')
```

---

## CLI / Notebook Example

```python
# Python / Jupyter cell
from pandora_mcp import PandoraMCP

mcp = PandoraMCP(project_id='f0b41abc-...')

# Step 3: Inject context
backlog_item = mcp.backlog_list()[0]
print(f"Tags: {backlog_item['tags']}")
print(f"Constraints: {backlog_item['constraints']}")

# Step 4: Execute with sub-tasks
mcp.workitem_add_subtask(
    parent_id='auth-task',
    title='JWT implementation',
    branch='feat/jwt'
)

mcp.workitem_update(
    id='auth-task',
    status='in_progress',
    branch='feat/auth-backend'
)

# Step 5: Validate
dashboard = mcp.dashboard()
print(f"Progress: {dashboard['workItemsDone']}/{dashboard['backlogTotal']}")
```

---

## Integration with Pandora Dashboard

**Frontend indicators:**
- Sub-task badge (↳) on kanban cards
- Branch name displayed in monospace font
- Tags displayed as colored chips
- Parent-child relationship shown via indentation or visual grouping

**Backend validations:**
- FK constraint prevents orphaned sub-tasks (OnDelete=Restrict)
- Auto-complete parent when all children Done (no manual intervention)
- Branch field optional but tracked for traceability

---

## References

- [Pandora MCP Documentation](../mcps/pandora-mcp.md)
- [Context-First Architecture](../ARCHITECTURE.md)
- [GitHub Copilot Instructions](../../.github/copilot-instructions.md)
- [MCP Prompt: `pandora_context_first_execute`](../mcps/pandora-mcp.md#available-prompts)
