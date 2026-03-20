# Integracao MCP com VS Code

Este projeto expoe um endpoint MCP via HTTP em `POST /mcp`.

## URL

- Local (porta alta): `http://localhost:58080/mcp`

## Handshake basico

Request:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/list"
}
```

Response (resumo):

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "tools": [
      { "name": "project.list" },
      { "name": "project.create" },
      { "name": "backlog.add" },
      { "name": "sprint.create" },
      { "name": "knowledge.checkpoint" }
    ]
  }
}
```

## Exemplo tools/call

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "project.create",
    "arguments": {
      "name": "Pandora Todo List",
      "description": "Projeto para orquestrar backlog e sprints"
    }
  }
}
```

## Exemplo de configuracao no VS Code (conceitual)

Use o mecanismo de MCP server do seu ambiente VS Code apontando para `http://localhost:58080/mcp` como servidor HTTP JSON-RPC.

Campos tipicos esperados no cliente:
- transport: `http`
- url: `http://localhost:58080/mcp`
- protocol: `jsonrpc`

## Recomendacao de porta

- Evite porta padrao (ex.: 3000/8080) para o endpoint MCP deste projeto.
- Mantenha configurado em porta alta: `58080`.

Ajuste o formato exato conforme a versao/extensao MCP instalada no VS Code.

