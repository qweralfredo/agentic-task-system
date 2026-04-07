---
name: core-coding
description: Help the coding agent plan before editing, prefer small safe changes, inspect relevant files first, explain tradeoffs briefly, and summarize touched files and verification steps. Use for general coding and refactoring tasks.
---

# Core Coding

Follow this workflow:

1. Inspect the smallest relevant surface first.
2. Produce a short execution plan before editing.
3. Prefer minimal safe changes over broad rewrites.
4. Verify effects after changes.
5. Summarize touched files and remaining risks.

## Passo 4 — Arquitetura de Branches em Cascata (Pandora Atomic Flow)

### Regras Inegociáveis para Git Flow Hierárquico

#### 1. **Hierarquia Obrigatória de Branches**

A estrutura de branches deve refletir rigorosamente a hierarquia do fluxo:

```
develop
  └── backlog/{id}
      └── sprint/{id}
          └── task/{id}
              └── subtask/{id}
```

#### 2. **Criação Hierárquica Sequencial**

O desenvolvimento só pode iniciar após a criação completa da hierarquia base a partir de `develop`:

```bash
git checkout develop
git checkout -b backlog/{id}
git checkout -b sprint/{id}
git checkout -b task/{id}
```

**Regra**: Nenhuma subtask pode ser criada antes que toda a cadeia superior exista.

#### 3. **Isolamento de Subtask**

Cada subtask deve originar sua própria branch **a partir da branch da task atual**:

```bash
git checkout task/{id}
git checkout -b subtask/{id}
```

**Regra**: Subtasks NUNCA devem originar diretamente de `develop` ou `sprint`.

#### 4. **Merge em Cascata (Bubble-up) com --no-ff**

A cada nível concluído, o merge deve ser feito **obrigatoriamente** na branch imediatamente superior:

```bash
# Subtask concluída
git checkout task/{id}
git merge --no-ff subtask/{id}
git branch -d subtask/{id}

# Task concluída
git checkout sprint/{id}
git merge --no-ff task/{id}
git branch -d task/{id}

# Sprint concluída
git checkout backlog/{id}
git merge --no-ff sprint/{id}
git branch -d sprint/{id}

# Backlog concluído
git checkout develop
git merge --no-ff backlog/{id}
git branch -d backlog/{id}
```

**Regras Críticas**:
- ✅ **Obrigatório**: usar `--no-ff` em TODOS os merges (documenta o merge commit)
- ✅ **Obrigatório**: deletar a branch após merge bem-sucedido
- ❌ **Proibido**: fazer merge em qualquer branch que não seja a imediatamente superior
- ❌ **Proibido**: fazer merge direto para `develop` pulando níveis intermediários
