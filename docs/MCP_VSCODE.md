# MCP no VS Code (Python SDK oficial)

Este projeto usa um servidor MCP em Python com FastMCP (SDK oficial).

Nao existe mais endpoint MCP em .NET (/mcp).

## 1. Subir backend API

A API REST precisa estar ativa para o MCP operar:

- Docker: docker compose up -d --build
- API local: cd backend/AgenticTodoList.Api && dotnet run

## 2. Preparar servidor MCP Python

```bash
cd mcp-server-python
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
```

## 3. Configurar no VS Code

Script automatico (recomendado):

- powershell -ExecutionPolicy Bypass -File .\ops\scripts\install-pandora-mcp-vscode.ps1

Para configurar GLOBAL (todos os workspaces do VS Code):

- powershell -ExecutionPolicy Bypass -File .\ops\scripts\install-pandora-mcp-vscode.ps1 -Global

Arquivos de destino:

- Workspace: .vscode/mcp.json
- Global: %APPDATA%\Code\User\mcp.json

Configuracao gerada em .vscode/mcp.json:

```json
{
  "servers": {
    "pandora-todo-list-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:8481/mcp"
    }
  }
}
```

## 4. Tools expostas

- project_list
- project_create
- project_delete
- backlog_add
- backlog_list
- sprint_create
- workitem_list
- workitem_update
- knowledge_checkpoint

## 5. Prompts expostos

- pandora_project_create
- pandora_sprint_create
- pandora_resources_guide

## 6. Resources expostos

Diretos:

- pandora://about
- pandora://projects/active
- pandora://projects/all

Templates:

- pandora://projects/{project_id}/context
- pandora://projects/{project_id}/dashboard
- pandora://projects/{project_id}/backlog
- pandora://projects/{project_id}/sprints
- pandora://projects/{project_id}/workitems
- pandora://projects/{project_id}/workitems/status/{status}
- pandora://projects/{project_id}/sprints/{sprint_id}/workitems
- pandora://projects/{project_id}/tasks/overview
- pandora://projects/{project_id}/tasks/triage
- pandora://projects/{project_id}/knowledge
