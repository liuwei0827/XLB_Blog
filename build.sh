#!/bin/sh
# XLB Blog -- Build & Start wrapper
# Usage: sh build.sh [--prod] [--skip-seed] [--port PORT]
# Run from the project root directory.
exec node build.js "$@"

# ── parse args ───────────────────────────────────────────────
PROD=false
SKIP_SEED=false
PORT_OVERRIDE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --prod)       PROD=true ;;
    --skip-seed)  SKIP_SEED=true ;;
    --port)       PORT_OVERRIDE="$2"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

# resolve project root  (POSIX, no dirname needed)
ROOT_DIR=$(cd "${0%/*}" 2>/dev/null && pwd || pwd)
cd "$ROOT_DIR"

# ── colors (disable when not a tty) ──────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
  CYAN='\033[0;36m' MAGENTA='\033[0;35m' GRAY='\033[0;37m'
  BOLD='\033[1m' NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' MAGENTA='' GRAY='' BOLD='' NC=''
fi

step() { printf "\n${CYAN}>> %s${NC}\n" "$1"; }
ok()   { printf "  ${GREEN}[OK]${NC}  %s\n" "$1"; }
warn() { printf "  ${YELLOW}[WARN]${NC} %s\n" "$1"; }
fail() { printf "  ${RED}[FAIL]${NC} %s\n" "$1"; exit 1; }
info() { printf "  ${GRAY}      %s${NC}\n" "$1"; }

# ── banner ───────────────────────────────────────────────────
printf "\n${MAGENTA}${BOLD}"
printf "  ==========================================\n"
printf "    XLB Blog  |  Build and Start\n"
printf "  ==========================================\n"
printf "${NC}\n"

# ── 1. check Node.js ─────────────────────────────────────────
step "Checking environment"

command -v node > /dev/null 2>&1 || fail "Node.js not found. Install Node.js >= 18"

NODE_VER=$(node -e "process.stdout.write(process.version)")
NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")

if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js $NODE_VER is too old. Requires >= v18"
fi
ok "Node.js $NODE_VER"

command -v npm > /dev/null 2>&1 || fail "npm not found"
ok "npm $(npm -v)"

# ── 2. install dependencies ───────────────────────────────────
step "Installing dependencies"

if [ "$PROD" = "true" ]; then
  info "Production mode -- npm ci --omit=dev"
  npm ci --omit=dev
else
  info "Development mode -- npm install"
  npm install
fi

ok "Dependencies ready"

# ── 3. setup .env ────────────────────────────────────────────
step "Configuring environment"

if [ ! -f ".env" ]; then
  cp .env.example .env
  ok ".env created from .env.example"
  warn "Consider updating SESSION_SECRET in .env for production"
else
  ok ".env already exists -- skipping"
fi

# use Node.js to update .env (no sed needed, cross-platform safe)
if [ -n "$PORT_OVERRIDE" ]; then
  node -e "
    const fs = require('fs'), p = '.env';
    let c = fs.readFileSync(p, 'utf8');
    if (/^PORT=/m.test(c)) { c = c.replace(/^PORT=.*/m, 'PORT=$PORT_OVERRIDE'); }
    else { c += '\nPORT=$PORT_OVERRIDE'; }
    fs.writeFileSync(p, c);
  "
  ok "Port set to $PORT_OVERRIDE"
fi

# ── 4. create required directories ───────────────────────────
step "Preparing directories"

for dir in data uploads; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    ok "Created: ${dir}/"
  else
    ok "Exists:  ${dir}/"
  fi
done

# ── 5. init database ─────────────────────────────────────────
step "Initializing database"

# read DB_PATH from .env using Node.js (no grep/cut, cross-platform)
DB_PATH=$(node -e "
  const fs = require('fs');
  const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
  const m = env.match(/^DB_PATH=(.+)/m);
  process.stdout.write(m ? m[1].trim() : 'data/blog.db');
")

if [ "$SKIP_SEED" = "true" ]; then
  warn "Skipping database seed (--skip-seed)"
elif [ -f "$DB_PATH" ]; then
  ok "Database exists: $DB_PATH -- skipping seed"
  info "Delete $DB_PATH and re-run to reset data"
else
  info "Running seed script..."
  node server/db/seed.js
  ok "Database initialized: $DB_PATH"
fi

# ── 6. build summary ─────────────────────────────────────────
step "Build summary"

ACTUAL_PORT=$(node -e "
  const fs = require('fs');
  const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
  const m = env.match(/^PORT=(.+)/m);
  process.stdout.write(m ? m[1].trim() : '3000');
")
[ -n "$PORT_OVERRIDE" ] && ACTUAL_PORT="$PORT_OVERRIDE"

MODE=development
[ "$PROD" = "true" ] && MODE=production

info "Mode     : $MODE"
info "Port     : $ACTUAL_PORT"
info "Database : $DB_PATH"
info "URL      : http://localhost:${ACTUAL_PORT}"
[ "$PROD" != "true" ] && info "Admin    : http://localhost:${ACTUAL_PORT}/admin  (admin / admin123)"

# ── 7. start server ──────────────────────────────────────────
printf "\n${MAGENTA}${BOLD}"
printf "  ==========================================\n"
printf "  Starting server ... Press Ctrl+C to stop\n"
printf "  ==========================================\n"
printf "${NC}\n"

if [ "$PROD" = "true" ]; then
  NODE_ENV=production node server/index.js
elif command -v nodemon > /dev/null 2>&1; then
  info "Using nodemon (hot-reload)"
  nodemon server/index.js
else
  warn "nodemon not found -- using node (no hot-reload)"
  node server/index.js
fi
