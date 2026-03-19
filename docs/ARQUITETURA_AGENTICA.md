# Arquitetura Agentica da Solucao

## Objetivo

Disponibilizar uma plataforma onde humanos e agentes de IA compartilham contexto operacional do ciclo de software (Scrum), com dados versionaveis, rastreaveis e persistentes.

## Contexto para IA (Knowledge-first)

Cada projeto possui:
- Wiki pages: conhecimento acumulado estruturado
- Knowledge checkpoints: snapshots de contexto em marcos importantes
- Agent runs: historico de execucoes para auditoria e replay de aprendizado

Esses artefatos permitem:
- onboarding acelerado de agentes
- retomada de contexto sem perda de informacao
- checkpoints para comparar decisoes tecnicas e riscos

## Entidades principais

- Project
- BacklogItem
- Sprint
- WorkItem
- Review
- WikiPage
- KnowledgeCheckpoint
- AgentRunLog

## Fluxo Scrum operacional

1. Criar projeto
2. Alimentar backlog com story points/prioridade
3. Criar sprint com backlog selecionado
4. Atualizar status de tarefas durante execucao
5. Registrar review
6. Atualizar wiki/checkpoints com aprendizados

## Fluxo Agentico via MCP

1. Agente conecta em `/mcp`
2. Solicita `tools/list`
3. Executa `tools/call` para operar no projeto
4. Salva checkpoints para preservar contexto

## Seguranca e confiabilidade

- Persistencia real via PostgreSQL
- Sem fallback e sem mock de runtime
- Backup em disco local (dumps diarios)
