# DevLake Integration Setup Guide

> Pandora DevLake Integration v1.0 | BL-20 SP-14

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Pandora Stack                            │
│                                                                 │
│  ┌──────────────┐   REST   ┌──────────────────────────────┐     │
│  │ Pandora API  │◄────────►│     DevLake (port 8082)      │     │
│  │ (.NET 10)    │          │   ┌──────────────────────┐   │     │
│  │ port 8500    │  webhook │   │   MySQL 8 (DevLake)  │   │     │
│  └──────┬───────┘          │   └──────────────────────┘   │     │
│         │ SSE              └──────────────────────────────┘     │
│  ┌──────▼───────┐                       │ MySQL                 │
│  │   Frontend   │             ┌─────────▼──────────┐            │
│  │  (port 8400) │             │  Grafana (port 3002)│           │
│  └──────────────┘             └────────────────────┘            │
│                                                                 │
│  ┌──────────────────┐   ┌──────────────────────────┐            │
│  │   PostgreSQL     │   │  postgres-backup sidecar │            │
│  │   (Pandora DB)   │   │  pg_dump every 30 min    │            │
│  └──────────────────┘   └──────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Minimum Version |
|------|-----------------|
| Docker | 24.0+ |
| Docker Compose | v2.20+ |
| RAM | 4 GB (8 GB recommended) |
| Disk | 10 GB free |

---

## Quick Start

### 1. Clone and configure

```bash
git clone <repo-url>
cd todolist
cp .env.example .env
```

Edit `.env` and set required values:
```env
DEVLAKE_WEBHOOK_SECRET=<strong-random-secret>
PANDORA_API_KEY=<your-api-key>
GF_SECURITY_ADMIN_PASSWORD=<grafana-password>
GITHUB_TOKEN=<github-personal-access-token>
```

### 2. Start the full stack

```bash
# Start all services including DevLake
docker compose --profile devlake up -d

# Verify health
docker compose ps
```

### 3. Initialize DevLake

```bash
# Configure GitHub connector and create blueprints
./scripts/devlake-setup-connectors.sh

# Seed MySQL schema for Pandora metrics
docker exec -i pandora-devlake-mysql mysql -u pandora -ppandora lake < ops/devlake/mysql/init/01_pandora_schema.sql
docker exec -i pandora-devlake-mysql mysql -u pandora -ppandora lake < ops/devlake/mysql/transformations/pandora_transforms.sql
```

### 4. Import Grafana dashboards

Dashboards are provisioned automatically via `ops/devlake/grafana/provisioning/dashboards/`.

Access Grafana at `http://localhost:3002` (admin / your-password).

---

## Service Endpoints

| Service | URL | Notes |
|---------|-----|-------|
| Pandora API | `http://localhost:8500` | Main backend |
| Frontend | `http://localhost:8400` | React app |
| Pandora MCP | `http://localhost:8481` | MCP server |
| DevLake API | `http://localhost:8082` | DevLake backend |
| DevLake Config UI | `http://localhost:4000` | DevLake configuration |
| Grafana | `http://localhost:3002` | Dashboards |
| PostgreSQL | `localhost:5432` | Pandora database |
| MySQL (DevLake) | `localhost:3306` | DevLake database |

---

## API Key Authentication

Protected endpoints require `X-Pandora-Api-Key` header:

```bash
# Trigger manual sync
curl -X POST http://localhost:8500/api/devlake/sync \
  -H "X-Pandora-Api-Key: $PANDORA_API_KEY"

# Get sync status
curl http://localhost:8500/api/devlake/sync/status \
  -H "X-Pandora-Api-Key: $PANDORA_API_KEY"

# Get audit log
curl http://localhost:8500/api/projects/{projectId}/audit-log \
  -H "X-Pandora-Api-Key: $PANDORA_API_KEY"
```

Configure API keys in `appsettings.json` or environment:
```json
{
  "Auth": {
    "ApiKeys": ["key-1", "key-2"]
  }
}
```

---

## Webhook Configuration

The Pandora API receives DevLake events at `POST /api/devlake/webhook`:

```bash
# Send a test webhook event
SECRET="your-webhook-secret"
PAYLOAD='{"eventType":"agent_run_completed","data":{"runId":"abc123"}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:8500/api/devlake/webhook \
  -H "Content-Type: application/json" \
  -H "X-Pandora-Signature-256: sha256=$SIG" \
  -d "$PAYLOAD"
```

Supported event types:
- `agent_run_completed`
- `evaluation_submitted`
- `workitem_updated`

---

## Metrics Endpoints

### Token & Cost Analytics

```bash
# Token summary for project (last 30 days)
GET /api/projects/{id}/metrics/token-summary?days=30

# Cost budget status
GET /api/projects/{id}/metrics/cost-budget
```

### ML Model Performance

```bash
# Latency percentiles + leaderboard
GET /api/projects/{id}/metrics/model-performance

# Drift detection (>15% latency degradation)
GET /api/projects/{id}/metrics/drift
```

### Real-time SSE

```javascript
const es = new EventSource('/api/metrics/stream');
es.addEventListener('agent_run_completed', (e) => {
  console.log(JSON.parse(e.data));
});
```

---

## Grafana Dashboards

| Dashboard | UID | Description |
|-----------|-----|-------------|
| AI Dev Overview | `pandora-ai-overview` | Agent runs, token usage, success rates |
| Human Evaluation | `pandora-human-eval` | Review queue, quality scores |
| DORA Metrics | `pandora-dora-metrics` | Deployment frequency, lead time, MTTR |
| Token Cost | `pandora-token-cost` | Cost per project/run, model comparison |
| Code Quality | `pandora-code-quality` | PR review time, churn, stale PRs |
| ML Performance | `pandora-ml-performance` | Latency percentiles, drift, leaderboard |

---

## Automated Backup

PostgreSQL is backed up every 30 minutes by the `postgres-backup` sidecar:

```bash
# Backups location
ls ops/postgres/backups/

# Manual backup
docker exec pandora-postgres-backup pg_dump -Fc -f /backups/manual.dump \
  -h postgres -U pandora pandora

# Restore
docker exec -i pandora-postgres pg_restore -U pandora -d pandora < backup.dump
```

Configure retention: `BACKUP_KEEP_DAYS=7` in `.env`.

---

## Troubleshooting

### DevLake not syncing
```bash
docker logs pandora-devlake 2>&1 | tail -50
# Check MySQL connectivity from DevLake
docker exec pandora-devlake curl -s http://pandora-devlake-mysql:3306
```

### API returns 401 on sync endpoints
- Ensure `Auth:ApiKeys` is configured in environment
- Pass correct `X-Pandora-Api-Key` header

### EF Core migration errors
```bash
docker exec pandora-api dotnet ef database update
# Or check __EFMigrationsHistory
docker exec pandora-postgres psql -U pandora -c "SELECT * FROM \"__EFMigrationsHistory\";"
```

### Grafana shows "No data"
- Verify DevLake MySQL datasource UID is `devlake-mysql-ds`
- Run ETL sync: `./scripts/devlake-etl-sync.sh`
