# DevLake e operações de métricas

## Papel

O **DevLake** (profile `devlake` no `docker-compose.yml`) fornece um *data lake* para engenharia; o repositório inclui **Grafana** com dashboards Pandora e um **plugin/collector** em Go que puxa dados da API Pandora para o ecossistema DevLake.

## Como ativar

```bash
docker compose --profile devlake up -d
```

Serviços típicos: MySQL do lake, DevLake core, Config UI, Grafana, imagem `pandora-devlake-plugin` (coletor).

## Rede

- `pandora-net` liga o coletor à API quando os hostnames estão corretos (ver variáveis `PANDORA_API_URL`, etc.).
- Documentação de setup detalhada: [../devlake-integration/DEVLAKE_SETUP_GUIDE.md](../devlake-integration/DEVLAKE_SETUP_GUIDE.md).

## API Pandora

O backend possui serviços e worker (`DevLakeSyncService`, `DevLakeSyncWorker`) para sincronização bidirecional/métricas conforme migrações e configuração do ambiente.

## Segurança

Alterar passwords padrão (`DEVLAKE_*`, Grafana) em produção; tratar `ENCRYPTION_SECRET` e ficheiros em `ops/devlake/config`.

## Wikis relacionadas

- Checkpoint de integração: [../devlake-integration/checkpoint.md](../devlake-integration/checkpoint.md)
