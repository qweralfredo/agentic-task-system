#!/usr/bin/env bash
# =============================================================================
# test_devlake_compose.sh — Smoke tests para a infraestrutura DevLake
# Executar APÓS: docker compose --profile devlake up -d
# =============================================================================
set -euo pipefail

PASS=0
FAIL=0
DEVLAKE_URL="${DEVLAKE_URL:-http://localhost:8082}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3002}"
CONFIG_UI_URL="${CONFIG_UI_URL:-http://localhost:4000}"

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

wait_for() {
  local url="$1" label="$2" retries="${3:-30}" delay="${4:-3}"
  for i in $(seq 1 $retries); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      pass "$label respondeu em ${i}x${delay}s"
      return 0
    fi
    sleep "$delay"
  done
  fail "$label não respondeu após $((retries * delay))s"
  return 1
}

echo ""
echo "=== DevLake Infrastructure Smoke Tests ==="
echo ""

# --- T-01-1: Serviços devlake e config-ui ---
echo "--- T-01-1: DevLake services ---"
wait_for "$DEVLAKE_URL/api/version" "DevLake API /api/version"
wait_for "$CONFIG_UI_URL" "DevLake Config UI"

# --- T-01-2: MySQL ---
echo ""
echo "--- T-01-2: MySQL DevLake ---"
if docker exec devlake-mysql mysqladmin ping -u root -pdevlake_root --silent 2>/dev/null; then
  pass "MySQL DevLake responde a ping"
else
  fail "MySQL DevLake não respondeu"
fi

if docker exec devlake-mysql mysql -u merico -pdevlake -e "SELECT 1" lake 2>/dev/null | grep -q "1"; then
  pass "MySQL DevLake: banco 'lake' acessível com usuário merico"
else
  fail "MySQL DevLake: banco 'lake' inacessível"
fi

# --- T-01-3: Grafana ---
echo ""
echo "--- T-01-3: Grafana ---"
wait_for "$GRAFANA_URL/api/health" "Grafana /api/health"

HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  -u admin:pandora-grafana "$GRAFANA_URL/api/datasources" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  pass "Grafana datasources API acessível (HTTP $HTTP_STATUS)"
else
  fail "Grafana datasources API retornou HTTP $HTTP_STATUS"
fi

# --- T-01-4: Networking e healthchecks ---
echo ""
echo "--- T-01-4: Networking & healthchecks ---"
for container in devlake-mysql devlake grafana; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health")
  if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "no-health" ]; then
    pass "Container $container: $STATUS"
  else
    fail "Container $container: $STATUS (esperado: healthy)"
  fi
done

NETWORK=$(docker network inspect pandora-devlake-net --format='{{.Name}}' 2>/dev/null || echo "")
if [ "$NETWORK" = "pandora-devlake-net" ]; then
  pass "Network pandora-devlake-net existe"
else
  fail "Network pandora-devlake-net não encontrada"
fi

# --- T-01-5: Volumes e estrutura de arquivos ---
echo ""
echo "--- T-01-5: Volumes & estrutura ---"
for dir in ops/devlake/mysql/data ops/devlake/grafana/data \
           ops/devlake/grafana/provisioning/datasources \
           ops/devlake/grafana/provisioning/dashboards; do
  if [ -d "$dir" ] || [ -d "c:/projetos/todolist/$dir" ]; then
    pass "Diretório $dir existe"
  else
    fail "Diretório $dir não encontrado"
  fi
done

# --- T-01-6: DevLake API versão e status ---
echo ""
echo "--- T-01-6: DevLake API version ---"
VERSION=$(curl -sf "$DEVLAKE_URL/api/version" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('version','unknown'))" 2>/dev/null || echo "unknown")
if [ "$VERSION" != "unknown" ] && [ -n "$VERSION" ]; then
  pass "DevLake versão: $VERSION"
else
  fail "DevLake versão não obtida (retornou: $VERSION)"
fi

# --- T-02-1: GitHub connector creation via REST API ---
echo ""
echo "--- T-02-1: GitHub connector API ---"
# Test: list existing GitHub connections (endpoint must respond)
GH_CONN_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  "$DEVLAKE_URL/api/plugins/github/connections" 2>/dev/null || echo "000")
if [ "$GH_CONN_STATUS" = "200" ]; then
  pass "DevLake GitHub connections endpoint acessível (HTTP $GH_CONN_STATUS)"
else
  fail "DevLake GitHub connections endpoint retornou HTTP $GH_CONN_STATUS (esperado: 200)"
fi

# Test: webhook connections endpoint available
WEBHOOK_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  "$DEVLAKE_URL/api/plugins/webhook/connections" 2>/dev/null || echo "000")
if [ "$WEBHOOK_STATUS" = "200" ]; then
  pass "DevLake webhook connections endpoint acessível (HTTP $WEBHOOK_STATUS)"
else
  fail "DevLake webhook connections endpoint retornou HTTP $WEBHOOK_STATUS (esperado: 200)"
fi

# --- T-02-2: Blueprint API ---
echo ""
echo "--- T-02-2: Blueprint API ---"
BLUEPRINT_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  "$DEVLAKE_URL/api/blueprints" 2>/dev/null || echo "000")
if [ "$BLUEPRINT_STATUS" = "200" ]; then
  pass "DevLake blueprints endpoint acessível (HTTP $BLUEPRINT_STATUS)"
else
  fail "DevLake blueprints endpoint retornou HTTP $BLUEPRINT_STATUS (esperado: 200)"
fi

# Test: blueprints list is valid JSON
BLUEPRINT_JSON=$(curl -sf "$DEVLAKE_URL/api/blueprints" 2>/dev/null || echo "")
if echo "$BLUEPRINT_JSON" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
  pass "DevLake blueprints API retornou JSON válido"
else
  fail "DevLake blueprints API não retornou JSON válido"
fi

# --- T-02-5: MySQL tables validation ---
echo ""
echo "--- T-02-5: MySQL DevLake tables ---"
# DevLake schema tables that must exist after initial startup
for table in _devlake_migrations pipelines tasks; do
  if docker exec devlake-mysql mysql -u merico -pdevlake lake \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='lake' AND table_name='${table}'" \
    2>/dev/null | grep -q "^[1-9]"; then
    pass "MySQL: tabela '${table}' existe no banco lake"
  else
    fail "MySQL: tabela '${table}' não encontrada no banco lake"
  fi
done

# --- Resumo ---
echo ""
echo "============================================"
echo "  RESULTADO: $PASS passaram | $FAIL falharam"
echo "============================================"

[ "$FAIL" -eq 0 ]
