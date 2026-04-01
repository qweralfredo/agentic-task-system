# Epic: Refactor DevLake para Vanilla & Correção Nginx 500

Mapeamos a origem do erro 500 no `devlake-config-ui` para a presença de quebras de linha (`\r`) do formato Windows que são propagadas pelas variáveis de ambiente (`DEVLAKE_ENDPOINT`) e que geram proxy paths que o Nginx não entende (ex: `"http://devlake:8080\r"`). 

Para corrigir isso de vez e garantir que nosso Devlake seja atualizável, faremos o downgrade para a imagem Vanilla conforme seu pedido e iremos adicionar nossas customizações aos poucos.

## 🗂 Backlog 1: Vanilla DevLake Baseline
- **Task 1.1 — Fetch Vanilla Compose** 
  - Fazer download do `docker-compose.yml` e `env.example` da versão oficial do incubating apache-devlake.
- **Task 1.2 — Sanitize Scripts & CRLF**
  - Corrigir a criação de variáveis no `devlake-init.sh` para evitar a contaminação do `.env` com quebras de linha `\r`. Adicionar flag `dos2unix` ou reescrita via parser.
- **Task 1.3 — Isolar `.env` do App Mount**
  - Remover o mapeamento de diretório `/ops/devlake/config` para `/app/.env` (que estava sobrescrevendo como diretório no container o que deveria ser um arquivo), usando o mapeamento nativo de dotfiles do docker compose.

## 🗂 Backlog 2: Pandora Features Injection
- **Task 2.1 — Restaurar DevLake Porta Padrão (8080)** 
  - Desliguei o contêiner colidente `siteblogolga-wp`. Bind de `8080:8080` será fixado no docker-compose do DevLake Vanilla.
- **Task 2.2 — Adicionar Conector Custom (Pandora Webhook)**
  - Reincorporar o blueprint e conector do Pandora ao compose Vanilla (como o service sidecar `pandora-devlake-collector`).
- **Task 2.3 — Teste E2E do UI (Validação de Porta)**
  - Reiniciar os containers e testar os chamados via HTTP POST para `http://localhost:4000/api/version` (espera-se 200 OK absoluto, sem 500s).

---

**Status:** Backlog items catalogados via API. Sprint creation bypass fallbacks em documentação provisória no rep, até a sincronização completa do MCP client na IDE.
