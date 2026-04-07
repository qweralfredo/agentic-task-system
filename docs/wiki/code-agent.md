# Code Agent (sandbox)

## Papel

O diretório `code-agent` é um **projeto isolado** que roda em Node e oferece uma UI inspirada em fluxos tipo Copilot/Claude Code, com **Ollama** para modelos locais e ferramentas restritas a um workspace de runtime.

## Relação com o Pandora SDD Task Manager

- **Não** é necessário para subir `docker compose` do núcleo (API + frontend + MCP + Postgres).
- **Não** depende do restante do repositório em runtime; útil para experimentação de agente com skills (`SKILL.md`) e sandbox de ficheiros/comandos.

## Isolamento

- Raiz de runtime padrão no Windows: `%LOCALAPPDATA%\Temp\code-agent-runtime`
- Em Docker: `/app/runtime`
- Skills em `code-agent/skills`

## Execução típica

Ver `code-agent/README.md`: servidor em porta alta (ex.: **8787**), comandos em background documentados no próprio README.

## Quando documentar no Pandora

Se uma equipa usar Code Agent **junto** com o Pandora para tarefas, registar no wiki do projeto: versão do Node, modelo Ollama, e política de pasta de workspace — para alinhar com `localPath` / `techStack` no config do projeto Pandora.
