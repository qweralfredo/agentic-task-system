# Arquitetura do Pandora Todo List

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
- BacklogItem (com Tags, WikiRefs, Constraints para context-first)
- Sprint
- WorkItem (com Branch tracking e ParentWorkItemId para sub-tasks)
- Review
- WikiPage
- KnowledgeCheckpoint
- AgentRunLog

## Recursos Avançados

### Recursive Sub-Tasks
- WorkItem pode ter ParentWorkItemId para criar hierarquia recursiva
- Auto-completamento: quando todos os sub-tasks estão Done, parent é auto-marcado como Done
- Usado para decomposição de tarefas complexas e rastreamento fino de progresso
- Sem limite de profundidade (n-níveis de nesting)

### Branch Tracking
- Cada WorkItem pode ter um campo Branch associado
- Permite rastreabilidade entre tarefas de código e branches git
- Preenchido durante execução do `workitem_update`
- Exibido no kanban para contexto de implementação

### Context-First Backlog Enrichment
- BacklogItem enriquecida com Tags, WikiRefs, Constraints
- Tags: métricas/características da tarefa (ex: "auth", "performance")
- WikiRefs: referências para páginas de conhecimento relevantes
- Constraints: limitações não-funcionais e restrições de design
- Alimenta o prompt `pandora_context_first_execute`

## Fluxo Scrum operacional

1. Criar projeto
2. Alimentar backlog com story points/prioridade
3. **[NEW]** Enriquecer backlog items com tags, wiki refs e constraints
4. Criar sprint com backlog selecionado
5. Atualizar status de tarefas durante execucao
6. **[NEW]** Criar sub-tasks se tarefas forem complexas
7. **[NEW]** Rastrear branch de trabalho em workitem_update
8. Registrar review
9. Atualizar wiki/checkpoints com aprendizados

## Fluxo do Pandora Todo List via MCP (Python SDK oficial)

1. Agente conecta no servidor `mcp-server-python/server.py` (stdio)
2. Invoca prompt `pandora_context_first_execute` para workflow estruturado
3. Solicita `tools/list` para descobrir funcionalidades
4. Executa `tools/call` para operar no projeto em 5 etapas:
   - **Scan:** lê dashboard e work items ativos via recursos MCP
   - **Warm-up:** carrega wiki pages e checkpoints relevantes
   - **Inject:** enriquece com tags/wiki_refs/constraints do backlog
   - **Execute:** implementa com sub-tasks se necessário, rastreando branch
   - **Review:** valida completamento e registra checkpoint
5. Servidor MCP chama a API REST do backend (`/api/...`)
6. Salva checkpoints para preservar contexto entre sessoes

## Atomic-Agent Flow

Metodologia de orquestração hierárquica fractal para converter intenções de alto nível em unidades atômicas de trabalho. Invocada via `/pandora-atomic-flow`.

### Motor de Expansão (Multiplicador C)

| Nível             | Fórmula           | C=1 | C=2 | C=3  |
|-------------------|-------------------|-----|-----|------|
| Backlogs          | 10 × C            | 10  | 20  | 30   |
| Sprints / Backlog | 7 × C             | 7   | 14  | 21   |
| Tasks / Sprint    | 3 × C             | 3   | 6   | 9    |
| Subtasks / Task   | 4 × C             | 4   | 8   | 12   |

No nível C=3: até **22.680 subtasks atômicas**.

### Protocolo de Branches Efêmeras

Cada subtask recebe uma branch de vida curta `task/{work_item_id}`:

- Criada a partir de `develop`
- Implementação atômica (arquivo único)
- Merge `--no-ff` → `develop`
- Branch deletada após merge

Ver referência completa: [docs/skills/pandora-atomic-flow.md](skills/pandora-atomic-flow.md)

## Seguranca e confiabilidade

- Persistencia real via PostgreSQL
- Sem fallback e sem mock de runtime
- Backup em disco local (dumps diarios)
- Auto-completamento de pais previne orfanatos de tarefas
- Constraints de FK com OnDelete(Restrict) evita cascata acidental
