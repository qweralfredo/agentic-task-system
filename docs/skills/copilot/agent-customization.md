# Skill: agent-customization

> **Tipo:** Skill nativa do VS Code Copilot  
> **Agente:** GitHub Copilot (Chat)  
> **Quando usar:** Criar, editar, revisar ou depurar arquivos de customização do Copilot

---

## O Que É

A skill `agent-customization` é uma skill nativa do GitHub Copilot com conhecimento especializado para trabalhar com o sistema de customização do VS Code Copilot. Ela sabe criar e editar:

- `.github/copilot-instructions.md` — instruções globais do workspace
- `.instructions.md` — instruções com `applyTo` para tipos específicos de arquivo
- `.prompt.md` — prompts reutilizáveis invocáveis pelo usuário
- `.agent.md` / `AGENTS.md` — definições de agentes customizados
- `SKILL.md` — definições de skills / conhecimento de domínio
- Regras de YAML frontmatter para todos os arquivos de customização acima

---

## Quando NÃO Usar

- Perguntas gerais de programação → usar o agente padrão
- Diagnóstico de erros em runtime → usar o agente padrão
- Configuração de servidor MCP → consultar a documentação do MCP diretamente
- Desenvolvimento de extensões do VS Code

---

## Como Instalar / Ativar

A skill `agent-customization` está embutida no GitHub Copilot — **não requer instalação separada**.

### Pré-requisitos

1. Extensão **GitHub Copilot** instalada no VS Code  
2. Extensão **GitHub Copilot Chat** instalada  
3. Conta GitHub com acesso ao Copilot (plano Individual, Business ou Enterprise)

```bash
# Verificar se as extensões estão instaladas
code --list-extensions | findstr copilot
# Saída esperada:
# GitHub.copilot
# GitHub.copilot-chat
```

### Ativar a Skill no Chat

A skill é invocada automaticamente quando você faz uma pergunta relacionada a customizações. Para invocá-la diretamente:

```
@copilot /agent-customization <sua pergunta>
```

Ou apenas descreva o que deseja e o Copilot selecionará a skill automaticamente.

---

## Como Usar

### Exemplo 1 — Criar um arquivo de instruções

```
Crie um arquivo .instructions.md para arquivos TypeScript
com as convenções do projeto: usar 2 espaços de indentação,
preferir arrow functions, evitar any.
```

### Exemplo 2 — Criar um prompt reutilizável

```
Crie um prompt .prompt.md chamado "create-controller" que
automaticamente gere um controller .NET com CRUD básico
para uma entidade fornecida.
```

### Exemplo 3 — Depurar por que uma instrução não está sendo aplicada

```
Minhas instruções em .github/copilot-instructions.md
não estão sendo seguidas. Por quê?
```

### Exemplo 4 — Criar um agente customizado

```
Crie um agente customizado para revisão de segurança de código
seguindo o OWASP Top 10.
```

---

## Estrutura de Arquivos de Customização

```
.github/
  copilot-instructions.md       # instruções globais do workspace
.copilot/
  instructions/
    *.instructions.md           # instruções com applyTo
  prompts/
    *.prompt.md                 # prompts reutilizáveis
  agents/
    *.agent.md                  # agentes customizados
  skills/
    */SKILL.md                  # skills de conhecimento de domínio
```

---

## Configurando applyTo (YAML frontmatter)

Instruções podem ser aplicadas seletivamente a tipos específicos de arquivo:

```yaml
---
applyTo: "**/*.ts,**/*.tsx"
---
# Instruções para TypeScript/React
```

Padrões suportados:
- `**/*.ts` — todos os arquivos TypeScript
- `src/**` — todos os arquivos dentro de src/
- `**` — todos os arquivos (padrão)

---

## Referências

- [Documentação Oficial — Copilot Customization](https://docs.github.com/en/copilot/customizing-copilot)
- [Configurações do VS Code Copilot](https://code.visualstudio.com/docs/copilot/copilot-settings)
