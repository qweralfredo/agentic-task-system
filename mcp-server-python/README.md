# Pandora MCP Server (Python)

Servidor MCP implementado em Python usando o SDK oficial (`mcp.server.fastmcp`).

---

## Novidades (v2.1)

- **Sub-tasks recursivas**: nova ferramenta `workitem_add_subtask` para criar tarefas filhas  
- **Branch tracking**: campo `branch` adicionado a `workitem_update`  
- **Context-first backlog**: nova ferramenta `backlog_context_update` para enriquecer metadados  
- **Prompt de execução**: `pandora_context_first_execute` com fluxo 5-passos estruturado

Ver [docs/skills/copilot/context-first-execution.md](../docs/skills/copilot/context-first-execution.md) para detalhes.

---

## Requisitos

- Python 3.11+
- API backend .NET executando (por padrao em `http://127.0.0.1:8480`)

## Setup

```bash
cd mcp-server-python
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
```

## Execucao

```bash
python server.py
```

Para rodar em HTTP (uso em Docker):

```bash
set PANDORA_MCP_TRANSPORT=streamable-http
set PANDORA_MCP_HOST=0.0.0.0
set PANDORA_MCP_PORT=8000
python server.py
```

## Smoke test do MCP (cliente)

Com a API backend ativa, execute:

```bash
python mcp_client_smoke_test.py --api-base-url http://127.0.0.1:8480
```

O script valida:

- handshake MCP
- listagem de tools esperadas
- chamadas reais de tools (create/list/add/sprint/workitem/delete)
- comportamento de arquivamento com include_archived

Variaveis opcionais:

- `PANDORA_API_BASE_URL` (default `http://127.0.0.1:8480`)
- `PANDORA_API_TIMEOUT` (default `30` segundos)
- `PANDORA_MCP_TRANSPORT` (default `stdio`, usar `streamable-http` no Docker)
- `PANDORA_MCP_HOST` (default `127.0.0.1`)
- `PANDORA_MCP_PORT` (default `8000`)
- `PANDORA_MCP_MOUNT_PATH` (default `/`)

## VS Code mcp.json

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
