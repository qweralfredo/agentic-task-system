# Backlog Merge Strategy — Atomic Flow v2.1+

## Overview

Updated Git flow for Pandora Atomic Flow where each backlog receives its own branch, all work is merged to that branch, and upon completion, the entire backlog is merged to `develop`.

**Key Change**: Backlogs are no longer merged directly into `develop` after each task. Instead, subtasks merge to the backlog branch, and the full backlog merges to `develop` only when complete.

---

## Branch Hierarchy

```
main
  └── develop (production-ready)
        ├── backlog/{backlog-id-1}      [← created from develop]
        │     ├── task/{subtask-id-1}   [← created from backlog/1]
        │     ├── task/{subtask-id-2}   [← created from backlog/1]
        │     └── ...
        │     ↓ [all tasks done]
        │     MERGE → develop [--no-ff]
        │     DELETE backlog/{backlog-id-1}
        │
        └── backlog/{backlog-id-2}      [← created from develop AFTER sync]
              ├── task/{subtask-id-n+1} [← created from backlog/2]
              └── ...
```

---

## Workflow — Step by Step

### Phase 1: Start First Backlog

```bash
# 1. Create backlog branch from develop
git checkout develop
git pull origin develop          # Always sync first
git checkout -b backlog/backlog-001

# 2. Register in Pandora
mcp__local__backlog_add(...)
mcp__local__sprint_create(...)
mcp__local__workitem_update(...status="todo"...)

# 3. Now ready for subtask execution
```

### Phase 2: Execute Subtasks (Daily Work)

```bash
# For each subtask:

# 1. Create task branch from current backlog
git checkout backlog/backlog-001
git checkout -b task/task-001

# 2. Implement feature (atomic scope)
# ... write code, tests, etc ...

# 3. Commit with semantic message
git add src/feature.ts tests/feature.test.ts
git commit -m "feat(task/task-001): implement new feature"

# 4. Merge back to backlog (NOT to develop!)
git checkout backlog/backlog-001
git merge task/task-001 --no-ff
git branch -d task/task-001

# 5. Register completion in Pandora
mcp__local__workitem_update(
  work_item_id = "task-001",
  status       = "done",
  branch       = "task/task-001",
  feedback     = "Feature implemented and tested"
)
```

### Phase 3: Complete Backlog — Merge to Develop

```bash
# When ALL sprints in backlog are done:

# 1. Verify all work items are done
backlog_list(project_id)  # Check backlog status
workitem_list(sprint_id)  # Verify ALL tasks = "done"

# 2. Prepare merge
git checkout backlog/backlog-001
git pull origin backlog/backlog-001    # Ensure up-to-date

# 3. CRITICAL: Sync develop before merge
git checkout develop
git pull origin develop                 # MUST sync before merge!

# 4. Execute merge with merge commit
git merge backlog/backlog-001 --no-ff -m "merge: conclude backlog-001 to develop"

# 5. Handle conflicts if any
# If conflicts appear:
#   a) Open conflicted files
#   b) Resolve conflicts manually (keep both changes if needed)
#   c) git add <resolved-file>
#   d) git commit (merge commit created automatically)

# 6. Push merged develop
git push origin develop

# 7. Cleanup backlog branch
git branch -d backlog/backlog-001               # local
git push origin --delete backlog/backlog-001    # remote

# 8. Update Pandora
mcp__local__backlog_item_update(
  backlog_item_id = "backlog-001",
  status         = "done",
  feedback       = "Merged to develop via Atomic Flow"
)

# 9. Create final checkpoint
mcp__local__knowledge_checkpoint(
  project_id       = "proj-001",
  name             = "Backlog 001 Complete — Atomic Flow",
  context_snapshot = "Completed all 3 sprints with 21 tasks",
  decisions        = ["Used backlog branch strategy", "Resolved 2 conflicts"],
  risks            = [],
  next_actions     = ["Start backlog-002 from develop"]
)
```

### Phase 4: Start Next Backlog — ALWAYS from Develop

```bash
# CRITICAL: Before starting next backlog, ALWAYS sync

# 1. Move to develop
git checkout develop

# 2. MUST sync with remote
git pull origin develop    # Get latest changes from completed backlog

# 3. Create new backlog branch from develop
git checkout -b backlog/backlog-002    # ← created from develop!

# 4. Register in Pandora and begin execution
mcp__local__backlog_add(...)
mcp__local__sprint_create(...)

# 5. Repeat from Phase 2
```

---

## Rules — Inviolable

### 1. Branch Creation
- ✅ Backlog created from: `develop` (always)
- ✅ Task created from: `backlog/{backlog-id}`
- ❌ Backlog created from: another backlog
- ❌ Task created from: develop

### 2. Merging
- ✅ Task merges to: `backlog/{backlog-id}` (--no-ff)
- ✅ Backlog merges to: `develop` (--no-ff)
- ❌ Task merges to: develop (skip backlog)
- ❌ Multiple merges directly to develop

### 3. Synchronization
- ✅ ALWAYS `git pull` before creating new backlog
- ✅ ALWAYS `git pull develop` before merging backlog
- ❌ Create backlog without syncing develop
- ❌ Merge backlog without syncing develop first

### 4. Cleanup
- ✅ Delete branches after merge (local AND remote)
- ✅ Update Pandora status to "done"
- ✅ Create knowledge_checkpoint at backlog completion
- ❌ Leave branches lingering after merge
- ❌ Skip Pandora updates

### 5. Conflicts
- ✅ Handle conflicts during merge
- ✅ Commit merge after conflict resolution
- ❌ Abort merge without resolving
- ❌ Force merge (--no-ff is required)

---

## Common Scenarios

### Scenario 1: First Backlog in Project
```bash
# Initial setup
git checkout develop
git pull origin develop
git checkout -b backlog/backlog-001

# Register and execute
mcp__local__backlog_add(project_id, ...)
# ... execute tasks ...

# Complete and merge
git checkout develop
git pull origin develop
git merge backlog/backlog-001 --no-ff
git push origin develop
git branch -d backlog/backlog-001
git push origin --delete backlog/backlog-001
```

### Scenario 2: Multiple Backlogs Sequential
```
[1] Create backlog/001 from develop
[2] Execute tasks → merge to backlog/001
[3] Merge backlog/001 → develop
[4] SYNC develop: git pull
[5] Create backlog/002 from develop  ← MUST be from develop!
[6] Execute tasks → merge to backlog/002
[7] Merge backlog/002 → develop
[8] Repeat for backlog/003, etc.
```

### Scenario 3: Parallel Backlog Branches (Not Recommended)
```bash
# If working on 2 backlogs in parallel:

# Backlog 1:
git checkout -b backlog/backlog-001  # from develop
# ... work on backlog-001 ...

# Backlog 2:
git checkout develop
git pull origin develop  # MUST sync!
git checkout -b backlog/backlog-002  # from updated develop
# ... work on backlog-002 ...

# CRITICAL: Both backlogs track develop separately
# Don't merge one backlog before creating the next
```

### Scenario 4: Conflict Resolution
```bash
# During merge: git merge backlog/backlog-001 --no-ff

# If conflicts appear in src/main.ts:
# 1. Edit src/main.ts manually
# 2. Choose desired code sections
# 3. Save file

git add src/main.ts
# Don't need to commit — merge commit is automatic
git log --oneline  # See merge commit was created

git push origin develop
```

---

## Pandora Integration

### Backlog Item Fields
```python
mcp__local__backlog_context_update(
  backlog_item_id = "<id>",
  tags            = ["atomic-flow", "backlog-strategy", "C1"],
  constraints     = "Branch: backlog/{id}; Merge strategy: per-backlog to develop"
)
```

### Work Item Tracking
```python
mcp__local__workitem_update(
  work_item_id = "<task-id>",
  status       = "done",
  branch       = "task/{task-id}",
  feedback     = "Merged to backlog/{backlog-id}",
  agent_name   = "Claude Code",
  model_used   = "claude-opus-4-6"
)
```

### Knowledge Checkpoint
```python
mcp__local__knowledge_checkpoint(
  project_id       = "<id>",
  name             = "Backlog X Complete",
  context_snapshot = "All sprints and tasks completed, merged to develop",
  decisions        = [
    "Used per-backlog branch strategy",
    "Resolved N conflicts during merge"
  ],
  risks            = [],
  next_actions     = [
    "Start backlog Y from develop",
    "Monitor develop for regressions"
  ]
)
```

---

## Troubleshooting

### Issue: "Cannot merge, develop is ahead"
```bash
# Before merge:
git checkout develop
git pull origin develop
# Then retry merge
```

### Issue: Merge conflicts during backlog merge
```bash
# 1. Identify conflicts
git status

# 2. Resolve in each file
# Open conflicted files and choose sections

# 3. Mark as resolved
git add <file>

# 4. Complete merge (auto-commit)
# Merge commit is created automatically

# 5. Push
git push origin develop
```

### Issue: "Task branch still exists"
```bash
# After merge, cleanup
git branch -d task/{task-id}           # local
git push origin --delete task/{task-id} # remote
```

### Issue: "Backlog branch not fully merged"
```bash
# Check status
git branch -vv backlog/backlog-001

# Verify all tasks are done in Pandora
workitem_list(sprint_id)  # All should be "done"

# Then merge
git merge backlog/backlog-001 --no-ff
```

---

## Best Practices

1. **Sync regularly**: `git pull` before creating branches
2. **Merge promptly**: Don't let backlog branches linger > 2 weeks
3. **Clean up**: Delete branches after merge (local + remote)
4. **Document**: Always create knowledge_checkpoint at completion
5. **Verify**: Check all tasks are done before merging backlog
6. **Communicate**: Notify team before merging to develop
7. **Test**: Run full test suite before merging backlog
8. **Monitor**: Watch for regressions after backlog merge

---

## References

- [Atomic-Agent Flow](pandora-atomic-flow.md) — Main methodology
- [Pandora MCP Reference](mcps/pandora-mcp.md) — API calls
- [Git Flow Guide](https://guides.github.com/introduction/flow/) — Git basics
