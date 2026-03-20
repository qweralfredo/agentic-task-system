# Integracao MCP com VS Code

Este projeto expoe um endpoint MCP HTTP/JSON-RPC em `POST /mcp`.

## Endpoint

- Local (porta alta): `http://127.0.0.1:58080/mcp`

## Configuracao do servidor no VS Code

Workspace config em `.vscode/mcp.json`:

```json
{
  "servers": {
    "pandora-todo-list-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:58080/mcp"
    }
  }
}
```

Deep link para adicionar no VS Code:

`vscode:mcp/install?%7B%22name%22%3A%22pandora-todo-list-mcp%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22http%3A%2F%2F127.0.0.1%3A58080%2Fmcp%22%7D`

## Metodos MCP suportados

- `tools/list`
- `tools/call`
- `prompts/list`
- `prompts/get`

## Catalogo de tools

- `project.list`: lista projetos
- `project.create`: cria projeto
- `backlog.add`: adiciona item de backlog
- `backlog.list`: lista backlog por projeto
- `sprint.create`: cria sprint com backlog items
- `workitem.list`: lista tarefas (work items) por projeto e sprint opcional
- `knowledge.checkpoint`: registra checkpoint de conhecimento

## Catalogo de prompts

- `pandora.project.create`: orienta criacao de projeto
- `pandora.backlog.add`: orienta criacao de backlog item
- `pandora.sprint.create`: orienta criacao de sprint
- `pandora.knowledge.checkpoint`: orienta registro de checkpoint
- `pandora.project.status`: orienta consulta de status/lista de projetos

## Handshake

Request (`tools/list`):

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/list"
}
```

Request (`prompts/list`):

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "prompts/list"
}
```

## Exemplo de chamada de tool

```json
{
  "jsonrpc": "2.0",
  "id": "3",
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

## Exemplo de chamada de prompt

```json
{
  "jsonrpc": "2.0",
  "id": "4",
  "method": "prompts/get",
  "params": {
    "name": "pandora.project.status",
    "arguments": {}
  }
}
```

## Teste rapido no VS Code

Use o arquivo `backend/AgenticTodoList.Api/AgenticTodoList.Api.http` e execute requests:

- MCP - listar tools
- MCP - listar projetos
- MCP - listar prompts
- MCP - obter prompt (status de projeto)

## Padrao operacional

- Para automacao: prefira `tools/call`.
- Para orientar conversa com o agente: use `prompts/get` e execute a tool sugerida no texto retornado.

## Recomendacao de porta

- Evite portas padrao de app (`3000`, `8080`) para MCP.
- Mantenha o Pandora MCP em porta alta: `58080`.

