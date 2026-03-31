# Dados e persistência

## PostgreSQL (núcleo)

- **Base:** `pandora_todo_list`
- **Utilizador/senha** no compose: configurados em `docker-compose.yml` (ambiente local; mudar em produção).
- **Volume:** `./ops/postgres/data` — dados duráveis no host.

## Migrações

A API aplica migrações EF Core automaticamente em ambientes não-`Testing`. O modelo inclui tabelas para Scrum, conhecimento, feedback de work items, métricas e integrações (ver `Migrations/`).

## Backups

- **Container `postgres-backup`:** `pg_dump` periódico para `./ops/postgres/backups`, com retenção por dias (`BACKUP_KEEP_DAYS`).
- **Scripts PowerShell:** `ops/scripts/backup-postgres.ps1`, `restore-postgres.ps1`.

Documentação: [../BACKUP-RESTORE.md](../BACKUP-RESTORE.md).

## Modelo mental para agentes

- **Projeto** agrupa backlog, sprints e artefatos de conhecimento.
- **Work items** podem formar árvores (sub-tasks) e carregar metadados de agente (tokens, branch, commits).
- **Wiki e checkpoints** são dados de primeira classe — devem ser atualizados nos marcos do processo.
