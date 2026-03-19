# Backup e Restore PostgreSQL

## Backup automatico em disco local

No `docker-compose.yml`, o servico `postgres-backup` salva dumps diarios em:

- `ops/postgres/backups`

Retencao configurada:
- 30 dias

## Persistencia do banco

Dados do Postgres:
- `ops/postgres/data`

## Restore manual

Com stack subida, restaure um arquivo dump com:

```powershell
docker exec -i agentic-postgres psql -U agentic -d agentic_todolist < .\ops\postgres\backups\SEU_ARQUIVO.sql
```

## Verificacao

1. Suba a stack
   - `docker compose up -d`
2. Verifique API
   - `curl http://localhost:8080/health`
3. Acesse UI
   - `http://localhost:3000`
