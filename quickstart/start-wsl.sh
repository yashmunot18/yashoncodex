#!/usr/bin/env bash
# ============================================================
#  NDC QMS – WSL / Ubuntu Local Install Script
#  Run from the repo root inside a WSL Ubuntu terminal:
#    bash quickstart/start-wsl.sh
#
#  What this script does (idempotent, non-destructive):
#    1. Installs Node 20, PostgreSQL, Redis (skips if already present)
#    2. Starts Postgres and Redis services
#    3. Creates DB user + database matching default .env values
#       (safe: uses CREATE IF NOT EXISTS pattern)
#    4. Copies .env.example → .env (only if .env doesn't exist)
#    5. Installs npm dependencies for API and Web
#    6. Runs Prisma migrations + seed
#    7. Builds API (TypeScript → dist/)
#    8. Starts API and Web in the background
#
#  After the script finishes:
#    Web  →  http://localhost:3000
#    API  →  http://localhost:4000/health
#
#  To stop everything:
#    kill $(cat /tmp/ndc_api.pid) $(cat /tmp/ndc_web.pid) 2>/dev/null
# ============================================================

set -e   # Exit immediately on any error
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
info() { echo -e "${CYAN}  ℹ  $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠  $*${NC}"; }
step() { echo -e "\n${YELLOW}[$1] $2${NC}"; }

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  NDC QMS – WSL / Ubuntu Local Quickstart  ${NC}"
echo -e "${CYAN}============================================${NC}"

# ── Step 1: Install system dependencies ──────────────────
step "1/7" "Installing Node 20, PostgreSQL, Redis..."

if ! command -v node &>/dev/null || [[ "$(node --version)" != v20* ]]; then
    info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs >/dev/null 2>&1
fi
ok "Node $(node --version) available."

if ! command -v psql &>/dev/null; then
    info "Installing PostgreSQL..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1
fi
ok "PostgreSQL $(psql --version | awk '{print $3}') available."

if ! command -v redis-cli &>/dev/null; then
    info "Installing Redis..."
    sudo apt-get install -y redis-server >/dev/null 2>&1
fi
ok "Redis available."

# ── Step 2: Start services ────────────────────────────────
step "2/7" "Starting PostgreSQL and Redis..."

sudo service postgresql start >/dev/null 2>&1 || true
ok "PostgreSQL started."

sudo service redis-server start >/dev/null 2>&1 || true
ok "Redis started."

# ── Step 3: Create DB user and database ──────────────────
step "3/7" "Setting up database user and database..."

# Idempotent: only creates if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='ndc_user'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE ROLE ndc_user WITH LOGIN PASSWORD 'ndc_pass';" >/dev/null 2>&1
ok "DB user 'ndc_user' ready."

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='ndc_qms'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ndc_qms OWNER ndc_user;" >/dev/null 2>&1
ok "Database 'ndc_qms' ready."

# ── Step 4: Environment file ──────────────────────────────
step "4/7" "Setting up .env..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    # Point to localhost (not Docker service names)
    sed -i 's|@postgres:|@localhost:|g' .env
    sed -i 's|redis://redis:|redis://localhost:|g' .env
    ok "Created .env (pointing to localhost Postgres + Redis)."
    info "Optional: open .env in nano/vi to add your RECEPTION_PROXY_* keys."
else
    ok ".env already exists – keeping it as-is."
fi

# ── Step 5: Install dependencies ─────────────────────────
step "5/7" "Installing npm dependencies..."

cd "$REPO_ROOT/apps/api"
npm install --silent
ok "API dependencies installed."

cd "$REPO_ROOT/apps/web"
npm install --silent
ok "Web dependencies installed."

# ── Step 6: Migrate, seed, build API ─────────────────────
step "6/7" "Running DB migrations, seed, and API build..."

cd "$REPO_ROOT/apps/api"

info "Running Prisma migrations..."
npx prisma migrate deploy 2>&1 | tail -3

info "Seeding database (safe to re-run)..."
npx prisma db seed 2>&1 | tail -3

info "Building API (TypeScript compile)..."
npm run build >/dev/null 2>&1
ok "API built successfully."

# ── Step 7: Start API and Web ─────────────────────────────
step "7/7" "Starting API and Web in background..."

# Stop any previously running instances started by this script
[ -f /tmp/ndc_api.pid ] && kill "$(cat /tmp/ndc_api.pid)" 2>/dev/null || true
[ -f /tmp/ndc_web.pid ] && kill "$(cat /tmp/ndc_web.pid)" 2>/dev/null || true

cd "$REPO_ROOT/apps/api"
nohup node dist/index.js > /tmp/ndc_api.log 2>&1 &
echo $! > /tmp/ndc_api.pid
ok "API started (PID $(cat /tmp/ndc_api.pid)) → logs at /tmp/ndc_api.log"

cd "$REPO_ROOT/apps/web"
nohup npm run start > /tmp/ndc_web.log 2>&1 &
echo $! > /tmp/ndc_web.pid
ok "Web started (PID $(cat /tmp/ndc_web.pid)) → logs at /tmp/ndc_web.log"

# Wait a moment then verify
sleep 5
if curl -sf http://localhost:4000/health >/dev/null 2>&1; then
    ok "API health check passed ✓"
else
    warn "API did not respond yet – check logs: tail -f /tmp/ndc_api.log"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  System is running!${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "  Web  →  ${CYAN}http://localhost:3000${NC}"
echo -e "  API  →  ${CYAN}http://localhost:4000/health${NC}"
echo ""
echo -e "  To stop: ${YELLOW}kill \$(cat /tmp/ndc_api.pid) \$(cat /tmp/ndc_web.pid)${NC}"
echo -e "  Logs:    ${YELLOW}tail -f /tmp/ndc_api.log /tmp/ndc_web.log${NC}"
echo ""

# ── Manual steps note ─────────────────────────────────────
echo -e "${YELLOW}Manual steps (if needed):${NC}"
echo "  • Add RECEPTION_PROXY_BASE_URL and RECEPTION_PROXY_API_KEY to .env"
echo "    then restart: kill \$(cat /tmp/ndc_api.pid) && cd apps/api && nohup node dist/index.js > /tmp/ndc_api.log 2>&1 &"
echo "  • To build Web for prod: cd apps/web && npm run build && npm run start"
echo "  • To view all DB tables: psql -U ndc_user -d ndc_qms -h localhost"
echo "    (password: ndc_pass)"
echo ""
