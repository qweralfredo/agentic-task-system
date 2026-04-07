# MCP: Pandora SDD Task Manager

> **Type:** Model Context Protocol (MCP) Server  
> **Protocol:** HTTP Streamable (FastMCP)  
> **Local URL:** `http://127.0.0.1:8481/mcp`  
> **When to use:** Manage backlog, sprints, tasks, and knowledge bases via AI agent

---

## What It Is

The **Pandora MCP Server** is a Python MCP server (FastMCP) that exposes the Pandora SDD Task Manager API as tools for AI agents. It enables GitHub Copilot and other agents to:

- Create and manage projects, backlog items, sprints, and work items
- Update task status in real time during development
- Track agentic context (tokens, model, IDE, feedback)
- Maintain knowledge bases: wiki, documentation, checkpoints

---

## How to Install in VS Code (Windows — recommended)

### Option 1: Automated script (Windows PowerShell)

```powershell
# From project root
powershell -ExecutionPolicy Bypass -File .\ops\scripts\install-pandora-mcp-vscode.ps1

# To automatically open the install link:
powershell -ExecutionPolicy Bypass -File .\ops\scripts\install-pandora-mcp-vscode.ps1 -OpenInstallLink
```

### Option 2: Manual VS Code configuration

1. Open `settings.json` (`Ctrl+Shift+P` → `Open User Settings JSON`)
2. Add the following entry:

```json
{
  "mcp": {
    "servers": {
      "pandora-mcp": {
        "type": "http",
        "url": "http://127.0.0.1:8481/mcp"
      }
    }
  }
}
```

3. Save and reload VS Code (`Ctrl+Shift+P` → `Developer: Reload Window`)

---

## How to Start the Server

The MCP server is part of the project's Docker Compose:

```bash
# From project root — starts all services including pandora-mcp
docker compose up -d

# Check if it's running
docker compose ps pandora-mcp

# View logs
docker compose logs pandora-mcp -f
```

### Check server health

```bash
curl http://127.0.0.1:8481/health
# Expected response: {"status":"ok"}
```

---

## Available Tools

| Tool | Description |
|---|---|
| `project_list` | List all projects |
| `project_create` | Create a new project |
| `project_config_update` | Update project settings |
| `backlog_list` | List backlog items |
| `backlog_add` | Add item to backlog |
| `backlog_context_update` | **NEW:** Update backlog item context (tags, wiki refs, constraints) |
| `sprint_create` | Create a new sprint |
| `workitem_list` | List work items |
| `workitem_update` | Update work item status/context |
| `workitem_add_subtask` | **NEW:** Create a sub-task (child work item) |
| `wiki_add` | Add a wiki page |
| `wiki_list` | List wiki pages |
| `documentation_add` | Add a documentation page |
| `documentation_list` | List documentation pages |
| `knowledge_checkpoint` | Create a knowledge checkpoint |
| `knowledge_list` | List checkpoints |
| `checkpoint_list` | List checkpoints by project |

---

## Required Fields per Tool

### backlog_add

```json
{
  "project_id": "project-uuid",
  "title": "Story title",
  "description": "Detailed description",
  "priority": 1,
  "story_points": 3
}
```

`priority` values: `Low=0`, `Medium=1`, `High=2`, `Critical=3`

### sprint_create

```json
{
  "project_id": "project-uuid",
  "name": "Sprint 1 — Name",
  "goal": "Sprint goal",
  "start_date": "2026-03-20",
  "end_date": "2026-03-26",
  "backlog_item_ids": ["item-uuid-1", "item-uuid-2"]
}
```

### workitem_update

```json
{
  "work_item_id": "work-item-uuid",
  "status": 1,
  "assignee": "GitHub Copilot",
  "branch": "develop",
  "agent_name": "GitHub Copilot",
  "model_used": "Claude Sonnet 4.6",
  "ide_used": "VS Code",
  "tokens_used": 5000,
  "feedback": "Summary of what was done",
  "metadata_json": "{}"
}
```

`status` values: `Todo=0`, `InProgress=1`, `Done=2`, `Review=3`

**NEW:** `branch` field allows tracking git branches associated with work items (optional).

### workitem_add_subtask

```json
{
  "parent_work_item_id": "parent-uuid",
  "title": "Sub-task title",
  "description": "Detailed description",
  "assignee": "GitHub Copilot",
  "branch": "develop",
  "tags": "tag1,tag2"
}
```

**NEW:** Creates a recursive sub-task linked to a parent work item. Parent auto-completes when all children are Done.

### backlog_context_update

```json
{
  "backlog_item_id": "backlog-uuid",
  "tags": "key-pair,feature,api",
  "wikiRefs": "architecture-doc",
  "constraints": "Must maintain backward compatibility"
}
```

**NEW:** Enriches backlog items with metadata for context-first execution flow.

### knowledge_checkpoint

```json
{
  "project_id": "project-uuid",
  "name": "Sprint 1 Completed",
  "context_snapshot": "Current project context",
  "decisions": "Decisions made in this sprint",
  "risks": "Identified risks",
  "next_actions": "Planned next actions"
}
```

---

## Available Prompts

| Prompt | Description |
|---|---|
| `pandora_resources_guide` | Complete guide to all MCP resources and tools |
| `pandora_project_config` | Project configuration and environment setup |
| `pandora_context_first_execute` | **NEW:** 5-step context-first execution flow for agents |

### pandora_context_first_execute

A structured workflow prompt for AI agents implementing context-first task execution:

1. **Discovery** — Scan project context and active work items without assumptions
2. **Knowledge Warm-up** — Retrieve and analyze relevant wiki pages and checkpoints
3. **Context Injection** — Load backlog item metadata (tags, wiki refs, constraints)
4. **Execution** — Implement task while maintaining cognitive state via sub-tasks and wiki updates
5. **Validation Review** — Verify completion and record learnings

Invoke before implementing any work item to ensure full context availability.

---

## Post-Installation Validation

```powershell
# Full validation script
powershell -ExecutionPolicy Bypass -File .\ops\scripts\validate-pandora-mcp-after-deploy.ps1 -SkipBuild
```

---

## This Workspace's Project

| Field | Value |
|---|---|
| **Name** | Todolist |
| **ID** | `f0b41abc-3a17-423c-a8b1-57aded62095c` |
| **API URL** | `http://127.0.0.1:8480` |
| **MCP** | `http://127.0.0.1:8481/mcp` |

---

## References

- [MCP Server README](../../mcp-server-python/README.md)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [FastMCP SDK](https://github.com/jlowin/fastmcp)
