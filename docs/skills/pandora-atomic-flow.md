# Atomic-Agent Flow

> **Type:** Pandora Skill — Motor de Planejamento Hierárquico Fractal
> **Invocação:** `/pandora-atomic-flow`
> **Skill global:** `~/.claude/commands/pandora-atomic-flow.md`
> **Quando usar:** Converter uma intenção de alto nível em uma malha completa, proporcional e rastreável de backlogs, sprints, tasks e subtasks com git flow atômico

---

## O que é

O **Atomic-Agent Flow** é uma metodologia de orquestração de engenharia de software orientada a agentes, projetada para converter intenções de alto nível em milhares de unidades de trabalho rastreáveis, seguras e executáveis.

Diferente de sistemas lineares, este fluxo utiliza uma **arquitetura fractal** onde a complexidade define a densidade do planejamento e a precisão da execução.

---

## 1. Expansão Hierárquica Matemática

O sistema opera através de um motor de expansão recursiva. A granulometria das tarefas é ditada por um **multiplicador de complexidade (C)**, onde `C ∈ {1, 2, 3}`.

### Regra de Densidade

A estrutura mínima de um projeto segue a regra:

| Nível             | Fórmula  | C=0.2 | C=0.5 | C=1 | C=2 | C=3 |
|-------------------|----------|-------|-------|-----|-----|-----|
| Backlogs          | 10 × C   | 2     | 5     | 10  | 20  | 30  |
| Sprints / Backlog | 7 × C    | 1     | 4     | 7   | 14  | 21  |
| Tasks / Sprint    | 3 × C    | 1     | 2     | 3   | 6   | 9   |
| Subtasks / Task   | 4 × C    | 1     | 2     | 4   | 8   | 12  |

No nível máximo de complexidade **C=3**, o sistema orquestra uma malha de até **22.680 subtasks atômicas**, garantindo que nenhum detalhe técnico seja negligenciado pelo modelo de linguagem.

### Hierarquia Visual

```text
Intenção de Alto Nível
  └── Backlog 1 — épico/domínio funcional
        └── Sprint 1.1 — entrega incremental
              └── Task 1.1.1 — unidade de trabalho (≤ 2h)
                    └── Subtask 1.1.1.1 — operação atômica (arquivo único)
                    └── Subtask 1.1.1.2 — operação atômica
                    └── ...4×C subtasks
              └── Task 1.1.2
              └── ...3×C tasks
        └── Sprint 1.2
        └── ...7×C sprints
  └── Backlog 2
  └── ...10×C backlogs
```

### Regras de Decomposição

| Nível    | Critério de atomicidade                              |
|----------|------------------------------------------------------|
| Backlog  | Um épico ou domínio funcional distinto da intenção   |
| Sprint   | Uma entrega incremental e testável do épico          |
| Task     | Unidade máxima de 2h; deve ter critério de aceite    |
| Subtask  | **Arquivo único ou operação única** — sem ambiguidade|

---

## 2. Execução Atômica — Skill Pandora

A execução é delegada à **Skill Pandora** (`/pandora-execute`). Para cada subtask, a Pandora segue o protocolo de **Branches Efêmeras**:

### 2.1 Isolation — Branch de Vida Curta

Cada subtask recebe sua própria branch:

```text
task/{work_item_id}
```

### 2.2 Ciclo Completo por Subtask

```bash
# 1. Isolation
git checkout develop                        # base sempre develop (ou mainBranch)
git checkout -b task/{id}                   # branch efêmera

# 2. Atomic Development
# → implementação focada exclusivamente no escopo desta subtask
# → um arquivo, uma responsabilidade

# 3. Commit semântico
git add <arquivo(s) do escopo>
git commit -m "feat(task/{id}): <descrição atômica>"

# 4. Merge e limpeza (sem rastro)
git checkout develop
git merge task/{id} --no-ff
git branch -d task/{id}                     # branch deletada após merge

# 5. Registro no Pandora
workitem_update(
  work_item_id = "{id}",
  status       = "done",
  branch       = "task/{id}",
  feedback     = "<resultado da operação atômica>",
  agent_name   = "Claude Code",
  model_used   = "claude-sonnet-4-6",
  ide_used     = "VS Code"
)
```

### 2.3 Hierarquia Git

```text
main
  └── develop
        ├── task/{subtask-id-1}   ← merge → develop → delete
        ├── task/{subtask-id-2}   ← merge → develop → delete
        ├── task/{subtask-id-3}   ← merge → develop → delete
        └── task/{subtask-id-n}
```

**Invariantes do git flow:**

- Nunca commitar diretamente em `main` ou `develop`
- A branch efêmera sempre parte de `develop` (ou `mainBranch` do projeto)
- Branch deletada obrigatoriamente após o merge
- `branch` e `feedback` sempre registrados no `workitem_update`

---

## 3. Fluxo de Execução Completo

```text
/pandora-atomic-flow
    │
    ├── 0. Entrada
    │     ├── Intenção de alto nível
    │     └── Multiplicador C ∈ {1, 2, 3}
    │
    ├── 1. Motor de Expansão
    │     ├── Calcular malha: 10C backlogs × 7C sprints × 3C tasks × 4C subtasks
    │     └── Gerar plano hierárquico completo
    │
    ├── 2. Aprovação do Usuário
    │     └── Apresentar plano → aguardar confirmação
    │
    ├── 3. Registro no Pandora (MCP)
    │     ├── backlog_add          × 10C
    │     ├── backlog_context_update (tags: atomic-flow, C{n})
    │     ├── sprint_create        × 7C por backlog
    │     ├── workitem_update      (status=todo) × 3C por sprint
    │     └── workitem_add_subtask × 4C por task
    │
    ├── 4. Execução Atômica (/pandora-execute por subtask)
    │     ├── git checkout -b task/{id}
    │     ├── implementação atômica (escopo único)
    │     ├── git commit + merge → develop
    │     ├── git branch -d task/{id}
    │     └── workitem_update(status=done)
    │
    ├── 5. Checkpoint por Sprint (/pandora-checkpoint)
    │     └── knowledge_checkpoint ao fechar cada sprint
    │
    └── 6. Conclusão (/pandora-done)
          └── Checklist final ao fechar todos os backlogs
```

---

## 4. Registro no Pandora — Referência MCP

### Backlogs

```python
mcp__local__backlog_add(
  project_id   = "<id>",
  title        = "<épico — domínio funcional>",
  description  = "<objetivo e critério de aceite do épico>",
  priority     = 2,                      # High=2 por padrão
  story_points = C * 3                   # proporcional à densidade
)

mcp__local__backlog_context_update(
  backlog_item_id = "<id>",
  tags            = ["atomic-flow", "C{n}", "<domínio>"],
  wikiRefs        = [],
  constraints     = "C={n}; subtasks de arquivo único; branches efêmeras task/{id}"
)
```

### Sprints

```python
mcp__local__sprint_create(
  project_id       = "<id>",
  name             = "Sprint {backlog}.{n} — <entrega incremental>",
  goal             = "<critério de aceite desta sprint>",
  start_date       = "<YYYY-MM-DD>",
  end_date         = "<YYYY-MM-DD>",     # +7 dias por sprint (ajustável)
  backlog_item_ids = ["<backlog_id>"]
)
```

### Tasks

```python
mcp__local__workitem_update(
  work_item_id = "<id>",
  status       = "todo",
  assignee     = "Pandora",
  branch       = "task/{work_item_id}",
  agent_name   = "Claude Code",
  model_used   = "claude-sonnet-4-6",
  ide_used     = "VS Code"
)
```

### Subtasks

```python
mcp__local__workitem_add_subtask(
  parent_work_item_id = "<task_id>",
  title               = "<operação atômica — verbo + escopo>",
  description         = "<arquivo único ou responsabilidade única>",
  assignee            = "Pandora",
  branch              = "task/{subtask_id}",
  tags                = ["atomic", "subtask", "C{n}"]
)
```

---

## 5. Tabela de Integração com Pandora MCP

| Fase         | Tool MCP                  | Quantidade        | Descrição                           |
|--------------|---------------------------|-------------------|-------------------------------------|
| Planejamento | `backlog_add`             | 10 × C            | Épico por domínio funcional         |
| Planejamento | `backlog_context_update`  | 10 × C            | Tags + constraints do atomic flow   |
| Planejamento | `sprint_create`           | 7 × C / backlog   | Entrega incremental por épico       |
| Execução     | `workitem_update`         | 3 × C / sprint    | Status + branch `task/{id}`         |
| Execução     | `workitem_add_subtask`    | 4 × C / task      | Subtask atômica de arquivo único    |
| Checkpoint   | `knowledge_checkpoint`    | 1 / sprint        | Snapshot ao fechar cada sprint      |

---

## 6. Enums de Referência

- `BacklogItemPriority`: Low=0, Medium=1, **High=2**, Critical=3
- `WorkItemStatus`: Todo=0, InProgress=1, Review=2, **Done=3**, Blocked=4
  - Use sempre **string labels**: `"todo"`, `"in_progress"`, `"review"`, `"done"`, `"blocked"`

---

## 7. Regras Inegociáveis

1. O plano completo da malha C× deve ser **apresentado e aprovado pelo usuário** antes de qualquer registro
2. Subtasks devem ter escopo de **arquivo único ou operação única** — sem ambiguidade de responsabilidade
3. Branches efêmeras **devem ser deletadas** após o merge — sem acúmulo de branches
4. Nunca estime `tokens_used` — passe `null` ou o valor real de observabilidade
5. Verificar com `backlog_list` e `workitem_list` antes de criar — evite duplicatas
6. Ao fechar cada sprint: registrar `knowledge_checkpoint`
7. Ao concluir todos os backlogs: executar `/pandora-done`

---

## Referências

- [Skill global](../../../../.claude/commands/pandora-atomic-flow.md) — `~/.claude/commands/pandora-atomic-flow.md`
- [Skill: pandora-execute](copilot/context-first-execution.md)
- [Pandora MCP Reference](../mcps/pandora-mcp.md)
- [Architecture](../ARCHITECTURE.md)
- [Copilot Instructions](../../.github/copilot-instructions.md)
