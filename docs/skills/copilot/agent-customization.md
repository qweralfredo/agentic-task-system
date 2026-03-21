# Skill: agent-customization

> **Type:** VS Code Copilot Built-in Skill  
> **Agent:** GitHub Copilot (Chat)  
> **When to use:** Create, edit, review, or debug Copilot customization files

---

## What It Is

The `agent-customization` skill is a native GitHub Copilot skill with specialized knowledge for working with the VS Code Copilot customization system. It knows how to create and edit:

- `.github/copilot-instructions.md` — global workspace instructions
- `.instructions.md` — instructions with `applyTo` for specific file types
- `.prompt.md` — reusable prompts invokable by the user
- `.agent.md` / `AGENTS.md` — custom agent definitions
- `SKILL.md` — skill / domain knowledge definitions
- YAML frontmatter rules for all customization files above

---

## When NOT to Use

- General programming questions → use the default agent
- Runtime error diagnosis → use the default agent
- MCP server configuration → consult MCP docs directly
- VS Code extension development

---

## How to Install / Activate

The `agent-customization` skill is built into GitHub Copilot — **no separate installation required**.

### Prerequisites

1. **GitHub Copilot** extension installed in VS Code  
2. **GitHub Copilot Chat** extension installed  
3. GitHub account with Copilot access (Individual, Business, or Enterprise plan)

```bash
# Verify extensions are installed
code --list-extensions | findstr copilot
# Expected output:
# GitHub.copilot
# GitHub.copilot-chat
```

### Activate the Skill in Chat

The skill is invoked automatically when you ask something customization-related. To invoke it directly:

```
@copilot /agent-customization <your question>
```

Or just describe what you want and Copilot will select the skill automatically.

---

## How to Use

### Example 1 — Create an instruction file

```
Create a .instructions.md file for TypeScript files
with project conventions: use 2-space tabs,
prefer arrow functions, avoid any.
```

### Example 2 — Create a reusable prompt

```
Create a .prompt.md prompt called "create-controller" that
automatically generates a .NET controller with basic CRUD
for a given entity.
```

### Example 3 — Debug why an instruction is not being applied

```
My instructions in .github/copilot-instructions.md
are not being followed. Why?
```

### Example 4 — Create a custom agent

```
Create a custom agent for security code review
following OWASP Top 10.
```

---

## Customization File Structure

```
.github/
  copilot-instructions.md       # global workspace instructions
.copilot/
  instructions/
    *.instructions.md           # instructions with applyTo
  prompts/
    *.prompt.md                 # reusable prompts
  agents/
    *.agent.md                  # custom agents
  skills/
    */SKILL.md                  # domain knowledge skills
```

---

## Configuring applyTo (YAML frontmatter)

Instructions can be selectively applied to specific file types:

```yaml
---
applyTo: "**/*.ts,**/*.tsx"
---
# Instructions for TypeScript/React
```

Supported patterns:
- `**/*.ts` — all TypeScript files
- `src/**` — all files under src/
- `**` — all files (default)

---

## References

- [Official Docs — Copilot Customization](https://docs.github.com/en/copilot/customizing-copilot)
- [VS Code Copilot Settings](https://code.visualstudio.com/docs/copilot/copilot-settings)