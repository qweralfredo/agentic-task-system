#!/usr/bin/env bash
# =============================================================================
# devlake-setup-connectors.sh — Configura todos os conectores e blueprints do
# DevLake de forma idempotente: GitHub + Pandora Webhook.
# Uso: ./scripts/devlake-setup-connectors.sh
# Pré-requisito: DevLake rodando (devlake-init.sh executado com sucesso)
# Variáveis necessárias: GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Carregar .env.devlake se existir
if [ -f "$PROJECT_ROOT/.env.devlake" ]; then
  set -a
  source "$PROJECT_ROOT/.env.devlake"
  set +a
fi

DEVLAKE_URL="${DEVLAKE_URL:-http://localhost:8080}"
GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN não configurado em .env.devlake}"
GITHUB_REPO_OWNER="${GITHUB_REPO_OWNER:-qweralfredo}"
GITHUB_REPO_NAME="${GITHUB_REPO_NAME:-agentic-task-system}"
PANDORA_API_URL="${PANDORA_API_URL:-http://localhost:5000}"

# ---------------------------------------------------------------------------
# Funções auxiliares
# ---------------------------------------------------------------------------

check_devlake() {
  local status
  status=$(curl -sf "$DEVLAKE_URL/api/version" 2>/dev/null | \
    python3 -c "import json,sys; print(json.load(sys.stdin).get('version','?'))" 2>/dev/null || echo "")
  if [ -z "$status" ]; then
    echo "ERRO: DevLake não disponível em $DEVLAKE_URL"
    echo "Execute primeiro: ./scripts/devlake-init.sh"
    exit 1
  fi
  echo "  DevLake versão: $status"
}

# GET idempotente — retorna ID de conexão existente pelo nome ou ""
get_connection_id() {
  local plugin="$1" name="$2"
  curl -sf "$DEVLAKE_URL/api/plugins/${plugin}/connections" 2>/dev/null | \
    python3 -c "
import json, sys
try:
    conns = json.load(sys.stdin)
    if isinstance(conns, list):
        for c in conns:
            if c.get('name','') == '${name}':
                print(c['id']); break
except: pass
" 2>/dev/null || echo ""
}

# GET idempotente — retorna ID de blueprint existente pelo nome ou ""
get_blueprint_id() {
  local name="$1"
  curl -sf "$DEVLAKE_URL/api/blueprints" 2>/dev/null | \
    python3 -c "
import json, sys
try:
    result = json.load(sys.stdin)
    # API can return {blueprints:[...]} or [...] depending on version
    bps = result.get('blueprints', result) if isinstance(result, dict) else result
    for b in bps:
        if b.get('name','') == '${name}':
            print(b['id']); break
except: pass
" 2>/dev/null || echo ""
}

echo "=== DevLake Connectors Setup ==="
echo "  DevLake URL:  $DEVLAKE_URL"
echo "  Repositório:  $GITHUB_REPO_OWNER/$GITHUB_REPO_NAME"
echo ""

# ---------------------------------------------------------------------------
# [1/5] Verificar DevLake
# ---------------------------------------------------------------------------
echo "[1/5] Verificando DevLake API..."
check_devlake

# ---------------------------------------------------------------------------
# [2/5] GitHub Connector (idempotente)
# ---------------------------------------------------------------------------
echo ""
echo "[2/5] Configurando conector GitHub..."

GH_CONN_NAME="${GITHUB_REPO_OWNER}-github"
CONN_ID=$(get_connection_id "github" "$GH_CONN_NAME")

if [ -n "$CONN_ID" ]; then
  echo "  Conector GitHub já existe (ID: $CONN_ID). Atualizando token..."
  curl -sf -X PATCH "$DEVLAKE_URL/api/plugins/github/connections/$CONN_ID" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${GH_CONN_NAME}\",
      \"endpoint\": \"https://api.github.com/\",
      \"token\": \"${GITHUB_TOKEN}\",
      \"rateLimitPerHour\": 4500
    }" > /dev/null || echo "  AVISO: PATCH retornou erro (pode ser OK se sem mudanças)."
  echo "  Conector GitHub atualizado. ID: $CONN_ID"
else
  echo "  Criando novo conector GitHub..."
  CONN_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/plugins/github/connections" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${GH_CONN_NAME}\",
      \"endpoint\": \"https://api.github.com/\",
      \"token\": \"${GITHUB_TOKEN}\",
      \"proxy\": \"\",
      \"rateLimitPerHour\": 4500
    }" 2>/dev/null || echo "{}")
  CONN_ID=$(echo "$CONN_RESPONSE" | python3 -c "
import json, sys
try: print(json.load(sys.stdin).get('id',''))
except: pass
" 2>/dev/null || echo "")
  if [ -n "$CONN_ID" ]; then
    echo "  Conector GitHub criado. ID: $CONN_ID"
  else
    echo "  AVISO: Não foi possível criar conector. Usando ID=1."
    CONN_ID=1
  fi
fi

# ---------------------------------------------------------------------------
# [3/5] Pandora Webhook Connector (idempotente)
# ---------------------------------------------------------------------------
echo ""
echo "[3/5] Configurando Pandora Webhook connector..."

WEBHOOK_CONN_NAME="pandora-webhook"
WH_CONN_ID=$(get_connection_id "webhook" "$WEBHOOK_CONN_NAME")

if [ -n "$WH_CONN_ID" ]; then
  echo "  Webhook connector já existe. ID: $WH_CONN_ID"
else
  echo "  Criando Pandora Webhook connector..."
  WH_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/plugins/webhook/connections" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${WEBHOOK_CONN_NAME}\"}" 2>/dev/null || echo "{}")
  WH_CONN_ID=$(echo "$WH_RESPONSE" | python3 -c "
import json, sys
try: print(json.load(sys.stdin).get('id',''))
except: pass
" 2>/dev/null || echo "")
  if [ -n "$WH_CONN_ID" ]; then
    WEBHOOK_URL="${DEVLAKE_URL}/api/plugins/webhook/${WH_CONN_ID}"
    echo "  Webhook connector criado. ID: $WH_CONN_ID"
    echo "  Webhook URL para Pandora: $WEBHOOK_URL"
    # Salvar URL do webhook no arquivo de config
    echo "DEVLAKE_WEBHOOK_URL=${WEBHOOK_URL}" >> "$PROJECT_ROOT/.env.devlake" 2>/dev/null || true
    echo "DEVLAKE_WEBHOOK_ID=${WH_CONN_ID}" >> "$PROJECT_ROOT/.env.devlake" 2>/dev/null || true
  else
    echo "  AVISO: Não foi possível criar webhook connector."
    WH_CONN_ID=""
  fi
fi

# ---------------------------------------------------------------------------
# [4/5] Blueprint de coleta automática (idempotente)
# ---------------------------------------------------------------------------
echo ""
echo "[4/5] Configurando blueprint de coleta automática..."

BLUEPRINT_NAME="Pandora GitHub Sync — ${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
BLUEPRINT_ID=$(get_blueprint_id "$BLUEPRINT_NAME")

if [ -n "$BLUEPRINT_ID" ]; then
  echo "  Blueprint já existe. ID: $BLUEPRINT_ID"
else
  echo "  Criando blueprint (coleta a cada 15m)..."
  BLUEPRINT_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/blueprints" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${BLUEPRINT_NAME}\",
      \"cronConfig\": \"*/15 * * * *\",
      \"enable\": true,
      \"isManual\": false,
      \"skipOnFail\": true,
      \"plan\": [[{
        \"plugin\": \"github\",
        \"options\": {
          \"connectionId\": ${CONN_ID},
          \"fullName\": \"${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}\",
          \"entities\": [\"CODE_REVIEW\", \"TICKET\", \"CICD\", \"CROSS_DOMAIN\"]
        }
      }]]
    }" 2>/dev/null || echo "{}")
  BLUEPRINT_ID=$(echo "$BLUEPRINT_RESPONSE" | python3 -c "
import json, sys
try: print(json.load(sys.stdin).get('id',''))
except: pass
" 2>/dev/null || echo "")
  if [ -n "$BLUEPRINT_ID" ]; then
    echo "  Blueprint criado. ID: $BLUEPRINT_ID"
  else
    echo "  AVISO: Blueprint pode já existir ou falhou ao criar."
  fi
fi

# ---------------------------------------------------------------------------
# [5/5] Trigger coleta inicial
# ---------------------------------------------------------------------------
echo ""
echo "[5/5] Disparando coleta inicial..."
if [ -n "$BLUEPRINT_ID" ]; then
  PIPELINE_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/blueprints/$BLUEPRINT_ID/trigger" \
    -H "Content-Type: application/json" 2>/dev/null || echo "{}")
  PIPELINE_ID=$(echo "$PIPELINE_RESPONSE" | python3 -c "
import json, sys
try: print(json.load(sys.stdin).get('id',''))
except: pass
" 2>/dev/null || echo "")
  if [ -n "$PIPELINE_ID" ]; then
    echo "  Pipeline iniciado. ID: $PIPELINE_ID"
    echo "  Status: $DEVLAKE_URL/api/pipelines/$PIPELINE_ID"
  else
    echo "  AVISO: Trigger retornou resposta inesperada (pode já estar rodando)."
  fi
fi

echo ""
echo "=== Conectores configurados ==="
echo ""
echo "  GitHub connector ID:  ${CONN_ID}"
if [ -n "${WH_CONN_ID:-}" ]; then
  echo "  Webhook connector ID: ${WH_CONN_ID}"
  echo "  Webhook URL:          ${DEVLAKE_URL}/api/plugins/webhook/${WH_CONN_ID}"
fi
echo ""
echo "  Coleta agendada: a cada 15 minutos"
echo "  Config UI:       http://localhost:4000"
echo "  Grafana:         http://localhost:3002"
echo ""
echo "Próximos passos:"
echo "  - Configure DEVLAKE_WEBHOOK_URL no backend Pandora para enviar eventos"
echo "  - Verifique dados em: http://localhost:4000"
