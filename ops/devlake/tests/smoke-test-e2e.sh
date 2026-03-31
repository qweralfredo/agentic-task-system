#!/bin/bash
# E2E smoke test for DevLake integration pipeline (BL-19 SP-14)
# Prerequisites: docker compose up --profile devlake
# Usage: ./ops/devlake/tests/smoke-test-e2e.sh [API_BASE_URL]

set -euo pipefail

API_BASE="${1:-http://localhost:8500}"
GRAFANA_BASE="${GRAFANA_URL:-http://localhost:3002}"
DEVLAKE_BASE="${DEVLAKE_URL:-http://localhost:8082}"
API_KEY="${PANDORA_API_KEY:-test-dev-key}"

PASS=0
FAIL=0

check() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    if [ "$actual" = "$expected" ]; then
        echo "  ✓ $desc"
        ((PASS++))
    else
        echo "  ✗ $desc (expected=$expected actual=$actual)"
        ((FAIL++))
    fi
}

http_status() {
    curl -s -o /dev/null -w "%{http_code}" "$@"
}

echo "=== Pandora DevLake E2E Smoke Tests ==="
echo "API: $API_BASE"
echo ""

# ─── 1. Infrastructure health ─────────────────────────────────────────────
echo "[1] Infrastructure Health"

STATUS=$(http_status "$API_BASE/health" 2>/dev/null || echo "000")
check "Pandora API /health returns 200" "200" "$STATUS"

STATUS=$(http_status "$DEVLAKE_BASE/api/version" 2>/dev/null || echo "000")
check "DevLake API /version reachable" "200" "$STATUS"

STATUS=$(http_status "$GRAFANA_BASE/api/health" 2>/dev/null || echo "000")
check "Grafana /api/health returns 200" "200" "$STATUS"

# ─── 2. Pandora API endpoints ────────────────────────────────────────────
echo ""
echo "[2] Pandora API Endpoints"

# Create a test project
PROJECT_JSON=$(curl -s -X POST "$API_BASE/api/projects" \
    -H "Content-Type: application/json" \
    -d '{"name":"E2E Smoke Test","description":"automated"}' 2>/dev/null || echo '{}')
PROJECT_ID=$(echo "$PROJECT_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "Create project returns id" "true" "$( [ -n "$PROJECT_ID" ] && echo true || echo false )"

if [ -n "$PROJECT_ID" ]; then
    # Add agent run
    RUN_JSON=$(curl -s -X POST "$API_BASE/api/projects/$PROJECT_ID/agent-runs" \
        -H "Content-Type: application/json" \
        -d "{\"agentName\":\"smoke-test\",\"entryPoint\":\"e2e\",\"inputSummary\":\"in\",\"outputSummary\":\"out\",\"startedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"completed\",\"modelName\":\"claude-sonnet-4-6\",\"tokensInput\":100,\"tokensOutput\":50,\"latencyMs\":500,\"costUsd\":0.01,\"success\":true,\"environment\":\"smoke-test\"}" 2>/dev/null || echo '{}')
    RUN_ID=$(echo "$RUN_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    check "Create agent run returns id" "true" "$( [ -n "$RUN_ID" ] && echo true || echo false )"

    # Token summary
    STATUS=$(http_status "$API_BASE/api/projects/$PROJECT_ID/metrics/token-summary")
    check "GET token-summary returns 200" "200" "$STATUS"

    # Cost budget
    STATUS=$(http_status "$API_BASE/api/projects/$PROJECT_ID/metrics/cost-budget")
    check "GET cost-budget returns 200" "200" "$STATUS"

    # Model performance
    STATUS=$(http_status "$API_BASE/api/projects/$PROJECT_ID/metrics/model-performance")
    check "GET model-performance returns 200" "200" "$STATUS"

    # Drift report
    STATUS=$(http_status "$API_BASE/api/projects/$PROJECT_ID/metrics/drift")
    check "GET drift returns 200" "200" "$STATUS"
fi

# ─── 3. Auth-protected endpoints ──────────────────────────────────────────
echo ""
echo "[3] Auth-Protected Endpoints"

STATUS=$(http_status "$API_BASE/api/devlake/sync/status")
check "GET /sync/status without key returns 401" "401" "$STATUS"

STATUS=$(http_status "$API_BASE/api/devlake/sync/status" -H "X-Pandora-Api-Key: $API_KEY")
check "GET /sync/status with key returns 200" "200" "$STATUS"

STATUS=$(http_status -X POST "$API_BASE/api/devlake/sync" -H "X-Pandora-Api-Key: $API_KEY")
check "POST /sync with key returns 200" "200" "$STATUS"

# ─── 4. SSE endpoint ─────────────────────────────────────────────────────
echo ""
echo "[4] SSE Endpoint"

SSE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 2 \
    -H "Accept: text/event-stream" \
    "$API_BASE/api/metrics/stream" 2>/dev/null || echo "000")
check "GET /metrics/stream returns 200" "200" "$SSE_STATUS"

# ─── 5. Grafana dashboards ────────────────────────────────────────────────
echo ""
echo "[5] Grafana Dashboards"

for UID in pandora-ai-overview pandora-human-eval pandora-dora-metrics pandora-token-cost pandora-code-quality pandora-ml-performance; do
    STATUS=$(http_status "$GRAFANA_BASE/api/dashboards/uid/$UID" 2>/dev/null || echo "000")
    check "Dashboard $UID exists" "200" "$STATUS"
done

# ─── Summary ─────────────────────────────────────────────────────────────
echo ""
echo "=== Results ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Total:  $((PASS + FAIL))"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "SMOKE TEST FAILED"
    exit 1
else
    echo "SMOKE TEST PASSED"
    exit 0
fi
