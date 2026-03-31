#!/usr/bin/env bash
# =============================================================================
# devlake-init.sh — Inicialização do stack DevLake
# Uso: ./scripts/devlake-init.sh
# Pré-requisito: Docker Desktop ≥24, RAM ≥4GB, arquivo .env.devlake configurado
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Pandora DevLake Init ==="
echo "Diretório do projeto: $PROJECT_ROOT"

# --- Pré-requisitos ---
echo ""
echo "[1/5] Verificando pré-requisitos..."

if ! command -v docker &>/dev/null; then
  echo "ERRO: Docker não encontrado. Instale Docker Desktop >=24."
  exit 1
fi

DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0.0.0")
echo "  Docker versão: $DOCKER_VERSION"

AVAILABLE_RAM=$(docker system info --format '{{.MemTotal}}' 2>/dev/null | awk '{printf "%.0f", $1/1073741824}')
echo "  RAM disponível para Docker: ~${AVAILABLE_RAM}GB"

if [ "${AVAILABLE_RAM:-0}" -lt 4 ]; then
  echo "AVISO: RAM disponível para Docker < 4GB. DevLake pode ser instável."
fi

# --- Arquivo .env.devlake ---
echo ""
echo "[2/5] Verificando .env.devlake..."
ENV_FILE="$PROJECT_ROOT/.env.devlake"

if [ ! -f "$ENV_FILE" ]; then
  echo "  .env.devlake não encontrado. Criando a partir do exemplo..."
  cp "$PROJECT_ROOT/.env.devlake.example" "$ENV_FILE"
  echo "  ATENÇÃO: Edite $ENV_FILE antes de continuar (especialmente GITHUB_TOKEN)."
  echo "  Pressione Enter para continuar ou Ctrl+C para cancelar."
  read -r
fi

set -a
source "$ENV_FILE"
set +a
echo "  .env.devlake carregado."

# --- Criar estrutura de diretórios ---
echo ""
echo "[3/5] Criando estrutura de diretórios..."
for dir in \
  ops/devlake/mysql/data \
  ops/devlake/grafana/data \
  ops/devlake/grafana/provisioning/datasources \
  ops/devlake/grafana/provisioning/dashboards \
  ops/devlake/grafana/dashboards \
  ops/devlake/config; do
  mkdir -p "$PROJECT_ROOT/$dir"
  echo "  ✓ $dir"
done

# Criar .gitignore para dados persistentes
cat > "$PROJECT_ROOT/ops/devlake/.gitignore" << 'EOF'
mysql/data/
grafana/data/
config/*.env
EOF
echo "  ✓ ops/devlake/.gitignore criado"

# --- Iniciar containers ---
echo ""
echo "[4/5] Iniciando stack DevLake..."
cd "$PROJECT_ROOT"
docker compose --profile devlake up -d

echo "  Aguardando serviços ficarem saudáveis (pode levar até 2 min)..."
sleep 15

# Verificar status
ATTEMPTS=0
MAX_ATTEMPTS=24
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  DEVLAKE_STATUS=$(docker inspect --format='{{.State.Status}}' devlake 2>/dev/null || echo "missing")
  MYSQL_STATUS=$(docker inspect --format='{{.State.Health.Status}}' devlake-mysql 2>/dev/null || echo "missing")

  if [ "$DEVLAKE_STATUS" = "running" ] && [ "$MYSQL_STATUS" = "healthy" ]; then
    echo "  MySQL: healthy | DevLake: running"
    break
  fi

  echo "  Aguardando... MySQL: $MYSQL_STATUS | DevLake: $DEVLAKE_STATUS (tentativa $((ATTEMPTS+1))/$MAX_ATTEMPTS)"
  sleep 5
  ((ATTEMPTS++))
done

# --- Executar testes de smoke ---
echo ""
echo "[5/5] Executando smoke tests..."
bash "$PROJECT_ROOT/ops/devlake/tests/test_devlake_compose.sh" || true

echo ""
echo "=== Serviços disponíveis ==="
echo "  DevLake API:    http://localhost:8082/api/version"
echo "  Config UI:      http://localhost:4000"
echo "  Grafana:        http://localhost:3002  (admin / ${GF_SECURITY_ADMIN_PASSWORD:-pandora-grafana})"
echo ""
echo "Próximo passo: ./scripts/devlake-setup-github.sh"
