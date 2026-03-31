# Wikis Pandora — Pandora Todo List

Este diretório contém **páginas de wiki** alinhadas ao hub de conhecimento do Pandora (wiki por projeto, decisões técnicas e onboarding de agentes). Use o conteúdo como base para criar ou sincronizar páginas via MCP (`wiki_add`) no projeto correspondente no Pandora.

## Índice das páginas

| Página | Tópico |
|--------|--------|
| [visao-geral-sistemas.md](visao-geral-sistemas.md) | Mapa dos sistemas, portas e dependências |
| [backend-api.md](backend-api.md) | API .NET, domínio, serviços e integrações |
| [frontend-dashboard.md](frontend-dashboard.md) | React, rotas e UX operacional |
| [mcp-python.md](mcp-python.md) | Servidor MCP FastMCP, ferramentas e recursos |
| [code-agent.md](code-agent.md) | Agente de código isolado (Ollama, sandbox) |
| [devlake-ops.md](devlake-ops.md) | DevLake, Grafana e plugin de coleta |
| [dados-persistencia.md](dados-persistencia.md) | PostgreSQL, backups e modelo mental de dados |
| [integracao-agentes.md](integracao-agentes.md) | Fluxo humano+IA, context-first e rastreabilidade |

## Documentação relacionada no repositório

- [../ARCHITECTURE.md](../ARCHITECTURE.md) — arquitetura e entidades
- [../GOVERNANCE.md](../GOVERNANCE.md) — governança e processos
- [../mcps/pandora-mcp.md](../mcps/pandora-mcp.md) — referência MCP
- [../../README.md](../../README.md) — visão geral e quick start

## Sugestão de títulos no Pandora

Ao criar wikis no Pandora, use títulos curtos e estáveis, por exemplo:

- `Sistemas — visão geral`
- `Backend API (.NET)`
- `Frontend dashboard`
- `MCP Python`
- `Code Agent (sandbox)`
- `DevLake e métricas`
- `Dados e persistência`
- `Integração com agentes`

Referencie essas páginas em `backlog_context_update` (`wikiRefs`) quando o backlog tratar do respectivo sistema.
