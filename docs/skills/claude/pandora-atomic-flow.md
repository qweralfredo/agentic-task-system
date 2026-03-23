# pandora-atomic-flow — Atomic-Agent Flow

Motor de expansão hierárquica fractal que converte uma intenção de alto nível em unidades atômicas de trabalho rastreáveis, proporcionais ao multiplicador de complexidade C.

---

## 0. Entrada Obrigatória

Antes de iniciar, confirme com o usuário:

- **Intenção de alto nível** — o que deve ser construído, refatorado ou investigado
- **Multiplicador C** — escolha proporcional à complexidade:

| C   | Perfil                                   |
|-----|------------------------------------------|
| 0.2 | Correção pontual / task isolada          |
| 0.5 | Feature pequena / melhoria simples       |
| 1   | Módulo novo / iniciativa de médio porte  |
| 2   | Feature complexa / múltiplos domínios    |
| 3   | Refactor estrutural / grande épico       |

Se não informado, pergunte explicitamente. Não assuma valores padrão.

---

## 1. Motor de Expansão Hierárquica (Densidade ∝ C)

Calcule a malha completa antes de registrar qualquer item no Pandora:

| Nível             | Fórmula  | C=0.2 | C=0.5 | C=1 | C=2 | C=3 |
|-------------------|----------|-------|-------|-----|-----|-----|
| Backlogs          | 10 × C   | 2     | 5     | 10  | 20  | 30  |
| Sprints / Backlog | 7 × C    | 1     | 4     | 7   | 14  | 21  |
| Tasks / Sprint    | 3 × C    | 1     | 2     | 3   | 6   | 9   |
| Subtasks / Task   | 4 × C    | 1     | 2     | 4   | 8   | 12  |

No nível C=3, o sistema orquestra até **22.680 subtasks atômicas**.

### Regras de Decomposição

- Cada **Backlog** representa um épico ou domínio funcional da intenção
- Cada **Sprint** representa uma entrega incremental dentro do épico
- Cada **Task** é uma unidade de trabalho máxima de 2h
- Cada **Subtask** é atômica — foco em um único arquivo ou operação

### Gerar o Plano (apresentar ao usuário antes de executar)

```text
## Atomic-Agent Flow — C={valor}

### Backlog 1: <épico>
  Sprint 1.1: <entrega incremental>
    Task 1.1.1: <máx 2h>
      Subtask 1.1.1.1 — <operação atômica>
      Subtask 1.1.1.2 — <operação atômica>
      ...
    Task 1.1.2: ...
  Sprint 1.2: ...

### Backlog 2: ...
```

**Aguarde aprovação do usuário antes de registrar no Pandora.**

---

## 2. Registro no Pandora via MCP

Após aprovação, registre proporcionalmente à malha definida.

### 2.1 Backlogs

```python
mcp__local__backlog_add(
  project_id,
  title        = "<épico>",
  description  = "<objetivo do épico>",
  priority     = 2,          # High=2 por padrão; ajuste conforme criticidade
  story_points = C * 3       # proporcional à complexidade
)

mcp__local__backlog_context_update(
  backlog_item_id,
  tags        = ["<domínio>", "atomic-flow", "C{valor}"],
  wikiRefs    = [],
  constraints = "C={valor}; subtasks atômicas de arquivo único"
)
```

### 2.2 Sprints

```python
mcp__local__sprint_create(
  project_id,
  name             = "Sprint {backlog}.{n} — <entrega>",
  goal             = "<critério de aceite da sprint>",
  start_date       = "<YYYY-MM-DD>",
  end_date         = "<YYYY-MM-DD>",   # +7 dias por sprint (ajustável)
  backlog_item_ids = ["<id do backlog pai>"]
)
```

### 2.3 Tasks (Work Items)

```python
mcp__local__workitem_update(
  work_item_id,
  status      = "todo",
  assignee    = "Pandora",
  branch      = "task/{work_item_id}",
  agent_name  = "Claude Code",
  model_used  = "claude-sonnet-4-6",
  ide_used    = "VS Code"
)
```

### 2.4 Subtasks (Hierarquia Recursiva)

```python
mcp__local__workitem_add_subtask(
  parent_work_item_id = "<task id>",
  title               = "<operação atômica>",
  description         = "<arquivo ou escopo único afetado>",
  assignee            = "Pandora",
  branch              = "task/{subtask_id}",
  tags                = ["atomic", "C{valor}"]
)
```

---

## 3. Protocolo de Branches Efêmeras (Git Flow Atômico)

Cada subtask recebe sua própria branch de vida curta:

```text
branch: task/{work_item_id}
```

### Ciclo Completo por Subtask

```bash
# 1. Isolamento
git checkout develop
git checkout -b task/{id}

# 2. Implementação atômica (escopo único)
# ... código focalizado apenas nesta subtask ...

# 3. Commit semântico
git add <arquivo(s) do escopo>
git commit -m "feat(task/{id}): <descrição atômica>"

# 4. Merge de volta
git checkout develop
git merge task/{id} --no-ff
git branch -d task/{id}

# 5. Atualizar Pandora
mcp__local__workitem_update(
  work_item_id = "{id}",
  status       = "done",
  branch       = "task/{id}",
  feedback     = "<resultado atômico>"
)
```

### Hierarquia de Branches

```text
main
  └── develop
        └── task/{subtask_id_1}    (vida curta)
        └── task/{subtask_id_2}    (vida curta)
        └── task/{subtask_id_n}    (vida curta)
```

- **Nunca** commite diretamente em `main` ou `develop`
- **Sempre** crie a branch a partir de `develop` (ou `mainBranch` do projeto)
- **Sempre** delete a branch efêmera após o merge
- **Sempre** registre o `branch` e `feedback` no `workitem_update` ao concluir

---

## 4. Execução Delegada à Skill Pandora

Para cada subtask, chame `/pandora-execute` (ou `/pandora-done` ao concluir):

```text
Para executar uma subtask:
  → /pandora-execute   # contexto + implementação atômica
  → /pandora-done      # checklist de conclusão + merge + registro
```

Ao concluir **todas as subtasks de uma task**, o pai é marcado `done` automaticamente pelo backend.

---

## 5. Checkpoint ao Fechar Sprint

Ao concluir todos os work items de uma sprint:

```python
mcp__local__knowledge_checkpoint(
  project_id       = "<id>",
  name             = "Checkpoint — Sprint {n} — Atomic Flow C={valor}",
  context_snapshot = "<o que foi construído nesta sprint>",
  decisions        = "<decisões técnicas tomadas>",
  risks            = "<riscos identificados>",
  next_actions     = "<próxima sprint ou próximo épico>"
)
```

---

## 6. Enums de Referência

- `BacklogItemPriority`: Low=0, Medium=1, High=2, Critical=3
- `WorkItemStatus`: Todo=0, InProgress=1, Review=2, Done=3, Blocked=4
  - **Use sempre string labels**: `"todo"`, `"in_progress"`, `"review"`, `"done"`, `"blocked"`

---

## 7. Regras Inegociáveis

- O plano completo (toda a malha C×) deve ser **apresentado e aprovado antes** de qualquer registro
- Subtasks devem ter escopo de **arquivo único ou operação única**
- Branches efêmeras devem ser deletadas após o merge — sem acúmulo
- Nunca estime `tokens_used` — passe `null` ou o valor real de observabilidade
- Evite duplicatas — verifique com `backlog_list` e `workitem_list` antes de criar
- Ao finalizar cada sprint, registre um `knowledge_checkpoint`
