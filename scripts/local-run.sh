#!/usr/bin/env bash
set -euo pipefail

# Local dev runner (no Docker): levanta infra mínima (Redis + Mosquitto WS, opcional), backend, frontend e mobile.
# Requisitos locais:
# - Node.js >= 18 e npm
# - PostgreSQL acessível em 127.0.0.1:5432 (sem criação automática de DB/usuário por padrão)
# - Opcional: Homebrew para instalar/acionar serviços ausentes no macOS
#   Dica: brew install redis mosquitto && brew services start redis

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)/.."
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

function have() { command -v "$1" >/dev/null 2>&1; }

function check_port() {
  local hostport="$1"
  local host="${hostport%:*}"; local port="${hostport##*:}"
  if have nc; then nc -z "$host" "$port" >/dev/null 2>&1; else return 0; fi
}

function info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
function warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
function err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

# Determine hash command
function _hash() {
  if have shasum; then shasum -a 256 "$@" 2>/dev/null | awk '{print $1}';
  elif have sha256sum; then sha256sum "$@" 2>/dev/null | awk '{print $1}';
  elif have md5; then md5 -q "$@" 2>/dev/null; else echo "nohash"; fi
}

# Install deps iff missing or lockfile changed
function ensure_npm_install() {
  local dir="$1"
  local lock=""
  if [ -f "$dir/pnpm-lock.yaml" ]; then lock="$dir/pnpm-lock.yaml"; fi
  if [ -z "$lock" ] && [ -f "$dir/yarn.lock" ]; then lock="$dir/yarn.lock"; fi
  if [ -z "$lock" ] && [ -f "$dir/package-lock.json" ]; then lock="$dir/package-lock.json"; fi
  local sig_file="$dir/.deps.hash"
  local to_hash=("$dir/package.json")
  [ -n "$lock" ] && to_hash+=("$lock")
  local cur_hash
  cur_hash=$(_hash "${to_hash[@]}")
  local need=0
  [ ! -d "$dir/node_modules" ] && need=1
  if [ $need -eq 0 ]; then
    if [ ! -f "$sig_file" ]; then need=1; else
      local old_hash; old_hash=$(cat "$sig_file" 2>/dev/null || echo "");
      [ "$old_hash" != "$cur_hash" ] && need=1
    fi
  fi
  if [ $need -eq 1 ]; then
    info "[$(basename "$dir")] instalando dependências"
    if [ -f "$dir/pnpm-lock.yaml" ]; then (cd "$dir" && npx -y pnpm@latest i --frozen-lockfile);
    elif [ -f "$dir/yarn.lock" ]; then (cd "$dir" && yarn --frozen-lockfile);
    elif [ -f "$dir/package-lock.json" ]; then (cd "$dir" && npm ci);
    else (cd "$dir" && npm install); fi
    echo "$cur_hash" > "$sig_file"
  else
    info "[$(basename "$dir")] deps ok"
  fi
}

# Flags
START_INFRA="${START_INFRA:-1}"        # 1 para tentar subir Redis/MQTT locais se não estiverem rodando
AUTO_INSTALL="${AUTO_INSTALL:-0}"       # 1 para instalar via brew redis/mosquitto automaticamente

# Defaults (override by exporting before running this script)
export DATABASE_URL="${DATABASE_URL:-postgresql://app:app@127.0.0.1:5432/app?schema=public}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
export MQTT_URL="${MQTT_URL:-mqtt://127.0.0.1:1883}"
export PORT="${PORT:-3000}"

export VITE_API_URL="${VITE_API_URL:-http://127.0.0.1:${PORT}}"
export VITE_MQTT_WS_URL="${VITE_MQTT_WS_URL:-ws://127.0.0.1:9001}"

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-$VITE_API_URL}"
export EXPO_PUBLIC_MQTT_WS_URL="${EXPO_PUBLIC_MQTT_WS_URL:-$VITE_MQTT_WS_URL}"

info "Root: $ROOT_DIR"

# Basic checks
have node || { err "Node.js não encontrado"; exit 1; }
have npm  || { err "npm não encontrado"; exit 1; }

check_port "127.0.0.1:5432" || warn "PostgreSQL não parece estar em 127.0.0.1:5432 (ajuste DATABASE_URL se necessário)"

# Kill children on exit
pids=()
cleanup() {
  info "Encerrando processos (PID: ${pids[*]:-})"
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 0.2
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

# --- Infra opcional (Redis + Mosquitto com WebSockets) ---
if [ "$START_INFRA" = "1" ]; then
  # Redis
  if check_port "127.0.0.1:6379"; then
    info "Redis já disponível em 127.0.0.1:6379"
  else
    if have redis-server; then
      info "Iniciando Redis local (foreground em background)"
      redis-server --protected-mode yes --port 6379 --bind 127.0.0.1 --save "" --appendonly no >"$LOG_DIR/redis.log" 2>&1 &
      echo $! >"$LOG_DIR/redis.pid" || true
      pids+=("$(cat "$LOG_DIR/redis.pid")")
      sleep 0.5
    else
      if have brew && [ "$AUTO_INSTALL" = "1" ]; then
        info "Instalando redis via Homebrew"
        brew install redis && brew services start redis || warn "Falha ao instalar/iniciar redis via brew"
      else
        warn "Redis não encontrado. Instale com: brew install redis && brew services start redis"
      fi
    fi
  fi

  # Mosquitto (com WS 9001)
  if check_port "127.0.0.1:9001"; then
    info "MQTT WS já disponível em 127.0.0.1:9001"
  else
    if have mosquitto; then
      info "Iniciando Mosquitto com WebSockets em 9001 (config temporária)"
      MOSQ_DIR="$LOG_DIR/mosquitto"
      mkdir -p "$MOSQ_DIR"
      MOSQ_CONF="$MOSQ_DIR/mosquitto-local.conf"
      cat >"$MOSQ_CONF" <<EOF
listener 1883 127.0.0.1
protocol mqtt

listener 9001 127.0.0.1
protocol websockets

persistence true
persistence_location $MOSQ_DIR/
log_dest file $MOSQ_DIR/mosquitto.log
allow_anonymous true
EOF
      mosquitto -c "$MOSQ_CONF" >"$MOSQ_DIR/run.log" 2>&1 &
      echo $! >"$MOSQ_DIR/mosquitto.pid" || true
      pids+=("$(cat "$MOSQ_DIR/mosquitto.pid")")
      sleep 0.5
    else
      if have brew && [ "$AUTO_INSTALL" = "1" ]; then
        info "Instalando mosquitto via Homebrew"
        brew install mosquitto || warn "Falha ao instalar mosquitto via brew"
      else
        warn "Mosquitto não encontrado. Instale com: brew install mosquitto"
      fi
    fi
  fi
fi

# Backend
pushd "$ROOT_DIR/backend" >/dev/null
ensure_npm_install "$PWD"
info "[backend] prisma generate"
npx prisma generate
info "[backend] prisma db push (sincronizando schema com o DB)"
npx prisma db push
info "[backend] iniciando em porta $PORT"
npm run start:dev >"$LOG_DIR/backend.log" 2>&1 &
backend_pid=$!
echo $backend_pid >"$LOG_DIR/backend.pid"
pids+=("$backend_pid")
popd >/dev/null

# Frontend (Vite)
pushd "$ROOT_DIR/frontend" >/dev/null
ensure_npm_install "$PWD"
info "[frontend] iniciando Vite em 5173"
npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
frontend_pid=$!
echo $frontend_pid >"$LOG_DIR/frontend.pid"
pids+=("$frontend_pid")
popd >/dev/null

# Mobile (Expo)
pushd "$ROOT_DIR/mobile" >/dev/null
ensure_npm_install "$PWD"
info "[mobile] iniciando Expo (Metro)"
npm run start >"$LOG_DIR/mobile.log" 2>&1 &
mobile_pid=$!
echo $mobile_pid >"$LOG_DIR/mobile.pid"
pids+=("$mobile_pid")
popd >/dev/null

info "Serviços iniciados. Logs em: $LOG_DIR"
info "URLs:"
cat <<EOF
- API (Swagger):   http://127.0.0.1:${PORT}/api
- Frontend (Vite): http://127.0.0.1:5173
- MQTT WS:         ${VITE_MQTT_WS_URL}
- Redis:           ${REDIS_URL}
- Postgres:        ${DATABASE_URL}
EOF

# Aguarda processos e captura Ctrl+C para encerrar
info "Aperte Ctrl+C para encerrar todos os serviços."
if [ ${#pids[@]} -gt 0 ]; then
  # Espera qualquer processo morrer e então encerra todos (resiliência)
  set +e
  while true; do
    for pid in "${pids[@]}"; do
      if ! kill -0 "$pid" 2>/dev/null; then
        warn "Processo $pid finalizou; encerrando os demais"
        exit 0
      fi
    done
    sleep 1
  done
  set -e
else
  # fallback
  wait
fi
