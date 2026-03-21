# MCP: Pandora Todo List

> **Type:** Model Context Protocol (MCP) Server  
> **Protocol:** HTTP Streamable (FastMCP)  
> **Local URL:** `http://127.0.0.1:8481/mcp`  
> **When to use:** Manage backlog, sprints, tasks, and knowledge bases via AI agent

---

## What It Is

The **Pandora MCP Server** is a Python MCP server (FastMCP) that exposes the Pandora Todo List API as tools for AI agents. It enables GitHub Copilot and other agents to:

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
| `sprint_create` | Create a new sprint |
| `workitem_list` | List work items |
| `workitem_update` | Update work item status/context |
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
  "agent_name": "GitHub Copilot",
  "model_used": "Claude Sonnet 4.6",
  "ide_used": "VS Code",
  "tokens_used": 5000,
  "feedback": "Summary of what was done",
  "metadata_json": "{}"
}
```

`status` values: `Todo=0`, `InProgress=1`, `Done=2`, `Review=3`

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
- [MCP in VS Code — Configuration](../MCP_VSCODE.md)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [FastMCP SDK](https://github.com/jlowin/fastmcp)
