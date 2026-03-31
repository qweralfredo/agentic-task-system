# MCP Python (FastMCP)

## Papel

O servidor em `mcp-server-python` implementa o **Model Context Protocol** sobre HTTP (streamable), expondo **ferramentas** que chamam a API REST interna (`PANDORA_API_BASE_URL` no Docker: `http://api:8080`).

## Transporte e URL

- Compose mapeia **8481 → 8000** no container MCP.
- VS Code / Cursor: configurar servidor MCP HTTP para `http://127.0.0.1:8481/mcp` (caminho conforme documentação do cliente).

## Ferramentas (exemplos)

Incluem: listagem/criação de projetos, backlog, contexto de backlog, sprints, work items (atualização, sub-tasks), wiki, documentação, checkpoints (`knowledge_checkpoint`), etc. Lista detalhada no [README](../../README.md).

## Recursos (read-only)

URIs `pandora://...` fornecem contexto para agentes: projetos, dashboard, backlog, work items por status, conhecimento, etc. Úteis no fluxo **context-first** antes de implementar.

## Prompts

Prompts guiados (ex.: criação de projeto/sprint, `pandora_context_first_execute`, guia de recursos) padronizam o comportamento dos agentes com o domínio Pandora.

## Boas práticas

- Obter `project_id` via `project_list` antes de criar itens.
- Evitar duplicatas: conferir `backlog_list` / `workitem_list`.
- Após mudanças relevantes, atualizar wiki/checkpoint conforme metodologia do projeto.
