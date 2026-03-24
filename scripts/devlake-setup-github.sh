#!/usr/bin/env bash
# =============================================================================
# devlake-setup-github.sh — Configura GitHub connector e blueprint no DevLake
# Uso: ./scripts/devlake-setup-github.sh
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

DEVLAKE_URL="${DEVLAKE_URL:-http://localhost:8082}"
GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN não configurado em .env.devlake}"
GITHUB_REPO_OWNER="${GITHUB_REPO_OWNER:-qweralfredo}"
GITHUB_REPO_NAME="${GITHUB_REPO_NAME:-agentic-task-system}"

echo "=== DevLake GitHub Connector Setup ==="
echo "  DevLake URL:  $DEVLAKE_URL"
echo "  Repositório:  $GITHUB_REPO_OWNER/$GITHUB_REPO_NAME"
echo ""

# --- Verificar DevLake disponível ---
echo "[1/4] Verificando DevLake API..."
VERSION=$(curl -sf "$DEVLAKE_URL/api/version" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('version','?'))" 2>/dev/null || echo "indisponível")
if [ "$VERSION" = "indisponível" ]; then
  echo "ERRO: DevLake não está disponível em $DEVLAKE_URL"
  echo "Execute primeiro: ./scripts/devlake-init.sh"
  exit 1
fi
echo "  DevLake versão: $VERSION"

# --- Criar conexão GitHub ---
echo ""
echo "[2/4] Criando conexão GitHub..."
CONN_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/plugins/github/connections" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${GITHUB_REPO_OWNER}-github\",
    \"endpoint\": \"https://api.github.com/\",
    \"token\": \"${GITHUB_TOKEN}\",
    \"proxy\": \"\",
    \"rateLimitPerHour\": 4500
  }" 2>&1) || {
  echo "AVISO: Conexão GitHub pode já existir. Tentando obter ID existente..."
  CONN_RESPONSE=$(curl -sf "$DEVLAKE_URL/api/plugins/github/connections" 2>/dev/null || echo "[]")
}

CONN_ID=$(echo "$CONN_RESPONSE" | python3 -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    if isinstance(d, list):
        for c in d:
            if '${GITHUB_REPO_OWNER}' in c.get('name', ''):
                print(c['id']); break
    else:
        print(d.get('id', ''))
except: pass
" 2>/dev/null || echo "")

if [ -z "$CONN_ID" ]; then
  echo "AVISO: Não foi possível obter ID da conexão. Usando ID=1."
  CONN_ID=1
else
  echo "  Conexão GitHub criada/encontrada. ID: $CONN_ID"
fi

# --- Criar blueprint ---
echo ""
echo "[3/4] Criando blueprint de coleta automática..."
BLUEPRINT_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/blueprints" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Pandora GitHub Sync — ${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}\",
    \"cronConfig\": \"0 */6 * * *\",
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
  }" 2>&1) || true

BLUEPRINT_ID=$(echo "$BLUEPRINT_RESPONSE" | python3 -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(d.get('id', ''))
except: pass
" 2>/dev/null || echo "")

if [ -n "$BLUEPRINT_ID" ]; then
  echo "  Blueprint criado. ID: $BLUEPRINT_ID"
else
  echo "  AVISO: Blueprint pode já existir ou falhou ao criar."
fi

# --- Trigger coleta inicial ---
echo ""
echo "[4/4] Disparando coleta inicial..."
if [ -n "$BLUEPRINT_ID" ]; then
  PIPELINE_RESPONSE=$(curl -sf -X POST "$DEVLAKE_URL/api/blueprints/$BLUEPRINT_ID/trigger" \
    -H "Content-Type: application/json" 2>&1) || true
  PIPELINE_ID=$(echo "$PIPELINE_RESPONSE" | python3 -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(d.get('id', ''))
except: pass
" 2>/dev/null || echo "")
  if [ -n "$PIPELINE_ID" ]; then
    echo "  Pipeline iniciado. ID: $PIPELINE_ID"
    echo "  Acompanhe em: $DEVLAKE_URL/api/pipelines/$PIPELINE_ID"
  fi
fi

echo ""
echo "=== GitHub connector configurado ==="
echo "  Coleta agendada: a cada 6 horas"
echo "  Verifique os dados em: http://localhost:4000"
echo "  Dashboard: http://localhost:3002"
