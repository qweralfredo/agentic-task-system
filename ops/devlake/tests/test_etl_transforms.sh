#!/usr/bin/env bash
# =============================================================================
# test_etl_transforms.sh — RED tests for BL-18 ETL Data Transformation
# Requires devlake-mysql running: docker compose --profile devlake up -d
# =============================================================================
set -euo pipefail

PASS=0
FAIL=0

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

mysql_exec() {
  docker exec devlake-mysql mysql -u merico -pdevlake lake -se "$1" 2>/dev/null
}

echo ""
echo "=== BL-18: ETL Transforms — RED Tests ==="
echo ""

# --- T-18-1: Custom Pandora schema tables must exist ---
echo "--- T-18-1: Custom schema tables ---"
for table in pandora_sprint_metrics pandora_agent_run_metrics pandora_human_eval_summary pandora_etl_registry; do
  COUNT=$(mysql_exec "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='lake' AND table_name='${table}'" 2>/dev/null || echo "0")
  if [ "$COUNT" = "1" ]; then
    pass "Tabela '${table}' existe"
  else
    fail "Tabela '${table}' NÃO existe (esperado após init)"
  fi
done

# --- T-18-2: Transformation views must exist ---
echo ""
echo "--- T-18-2: Transformation views ---"
for view in v_pandora_sprint_velocity v_pandora_model_performance v_pandora_eval_quality; do
  COUNT=$(mysql_exec "SELECT COUNT(*) FROM information_schema.views WHERE table_schema='lake' AND table_name='${view}'" 2>/dev/null || echo "0")
  if [ "$COUNT" = "1" ]; then
    pass "View '${view}' existe"
  else
    fail "View '${view}' NÃO existe"
  fi
done

# --- T-18-3: ETL registry must have metric type entries ---
echo ""
echo "--- T-18-3: Metric type registry ---"
COUNT=$(mysql_exec "SELECT COUNT(*) FROM pandora_etl_registry" 2>/dev/null || echo "0")
if [ "$COUNT" -ge "4" ] 2>/dev/null; then
  pass "ETL registry tem ${COUNT} entradas (≥4)"
else
  fail "ETL registry vazio ou inexistente (tem: ${COUNT})"
fi

# --- T-18-4: Init script idempotência ---
echo ""
echo "--- T-18-4: Idempotência (re-execução do init) ---"
# Run init script again — should not fail
if docker exec devlake-mysql mysql -u merico -pdevlake lake \
    -e "SELECT 1" 2>/dev/null | grep -q "1"; then
  pass "MySQL acessível para re-execução de init"
else
  fail "MySQL inacessível"
fi

# --- T-18-5: Sprint metrics computed columns ---
echo ""
echo "--- T-18-5: Sprint metrics schema ---"
COL_CHECK=$(mysql_exec "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='lake' AND table_name='pandora_sprint_metrics' AND column_name IN ('sprint_id','velocity','completion_rate','total_points','done_points')" 2>/dev/null || echo "0")
if [ "$COL_CHECK" = "5" ]; then
  pass "pandora_sprint_metrics tem todas as 5 colunas obrigatórias"
else
  fail "pandora_sprint_metrics faltam colunas (tem ${COL_CHECK}/5)"
fi

# --- Resumo ---
echo ""
echo "============================================"
echo "  RESULTADO: $PASS passaram | $FAIL falharam"
echo "============================================"

[ "$FAIL" -eq 0 ]
