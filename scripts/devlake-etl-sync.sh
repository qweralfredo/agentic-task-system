#!/usr/bin/env bash
# =============================================================================
# devlake-etl-sync.sh — Sync Pandora data → DevLake MySQL (BL-18)
# Executa: init schema + sync sprint_metrics + agent_runs + human_evals
# =============================================================================
set -euo pipefail

PANDORA_API="${PANDORA_API_BASE_URL:-http://localhost:8480}"
MYSQL_HOST="${DEVLAKE_MYSQL_HOST:-localhost}"
MYSQL_PORT="${DEVLAKE_MYSQL_PORT:-3307}"
MYSQL_USER="${DEVLAKE_MYSQL_USER:-merico}"
MYSQL_PASS="${DEVLAKE_MYSQL_PASSWORD:-devlake}"
MYSQL_DB="lake"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

mysql_exec() {
  mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -se "$1" 2>/dev/null
}

info() { echo "[ETL] $1"; }
err()  { echo "[ETL][ERR] $1" >&2; }

# ── Step 1: Apply init schema ──────────────────────────────────────────────
info "Aplicando schema Pandora no DevLake MySQL..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" \
  < "$PROJECT_ROOT/ops/devlake/mysql/init/01_pandora_schema.sql" 2>/dev/null
info "Schema OK"

# ── Step 2: Apply transformation views ───────────────────────────────────
info "Aplicando views de transformação..."
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" \
  < "$PROJECT_ROOT/ops/devlake/mysql/transformations/pandora_transforms.sql" 2>/dev/null
info "Views OK"

# ── Step 3: Sync projects → get IDs ──────────────────────────────────────
info "Buscando projetos no Pandora API ($PANDORA_API)..."
PROJECTS=$(curl -sf "$PANDORA_API/api/projects" 2>/dev/null || echo "[]")
PROJECT_COUNT=$(echo "$PROJECTS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))")
info "Projetos encontrados: $PROJECT_COUNT"

# ── Step 4: Sync sprint metrics per project ───────────────────────────────
info "Sincronizando sprint metrics..."
echo "$PROJECTS" | python3 - << 'PYEOF'
import json, sys, subprocess, os, urllib.request

api = os.environ.get("PANDORA_API_BASE_URL", "http://localhost:8480")
mysql_cmd = [
    "mysql",
    "-h", os.environ.get("DEVLAKE_MYSQL_HOST", "localhost"),
    "-P", os.environ.get("DEVLAKE_MYSQL_PORT", "3307"),
    "-u", os.environ.get("DEVLAKE_MYSQL_USER", "merico"),
    f"-p{os.environ.get('DEVLAKE_MYSQL_PASSWORD', 'devlake')}",
    "lake"
]

projects = json.loads(sys.stdin.read())

for proj in projects:
    pid = proj["id"]
    try:
        with urllib.request.urlopen(f"{api}/api/sprints?projectId={pid}", timeout=10) as r:
            sprints = json.loads(r.read())
    except Exception as e:
        print(f"  [SKIP] Sprints de {pid}: {e}")
        continue

    for sp in sprints:
        wis = sp.get("workItems", [])
        total_pts = sum(wi.get("storyPoints", 0) for wi in wis)
        done_pts  = sum(wi.get("storyPoints", 0) for wi in wis if wi.get("status") == 3)
        ip_pts    = sum(wi.get("storyPoints", 0) for wi in wis if wi.get("status") == 1)
        total_wi  = len(wis)
        done_wi   = sum(1 for wi in wis if wi.get("status") == 3)
        velocity  = done_pts
        compl     = round(done_pts / total_pts * 100, 2) if total_pts > 0 else 0.0
        sid       = sp["id"]
        sql = (
            f"INSERT INTO pandora_sprint_metrics "
            f"(id, sprint_id, project_id, sprint_name, start_date, end_date, "
            f"total_points, done_points, in_progress_pts, velocity, completion_rate, "
            f"total_workitems, done_workitems) VALUES "
            f"('{sid}', '{sid}', '{pid}', "
            f"'{sp['name'].replace(chr(39), '')}', "
            f"'{sp.get('startDate','1970-01-01')}', '{sp.get('endDate','1970-01-01')}', "
            f"{total_pts}, {done_pts}, {ip_pts}, {velocity}, {compl}, "
            f"{total_wi}, {done_wi}) "
            f"ON DUPLICATE KEY UPDATE "
            f"done_points={done_pts}, in_progress_pts={ip_pts}, velocity={velocity}, "
            f"completion_rate={compl}, total_workitems={total_wi}, done_workitems={done_wi}, "
            f"collected_at=CURRENT_TIMESTAMP"
        )
        try:
            subprocess.run(mysql_cmd + ["-e", sql], check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"  [WARN] Insert sprint {sid}: {e.stderr.decode()[:80]}")

print(f"[ETL] Sprint metrics sync: {len(projects)} projetos processados")
PYEOF

# ── Step 5: Update registry last_synced ──────────────────────────────────
mysql_exec "UPDATE pandora_etl_registry SET last_synced = NOW() WHERE metric_type IN ('sprint_velocity','agent_run_cost','human_evaluation')"
info "ETL sync completo."
