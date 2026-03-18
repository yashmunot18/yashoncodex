#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start-wsl.sh  –  Idempotent local-install quickstart for WSL (Ubuntu 22.04+)
#
# What it does (all checks are non-destructive):
#   1. Updates apt and installs Node 20, build tools, Git, Postgres, Redis
#   2. Starts Postgres and Redis services
#   3. Creates DB role 'ndc_user' and database 'ndc_qms' if they don't exist
#   4. Clones the repo into ~/yashoncodex, or pulls latest if already there
#   5. Copies .env.example → .env (only if .env doesn't already exist)
#   6. Installs deps, builds API, runs Prisma migrations + seed, starts API
#   7. Installs deps, builds web, starts Next.js web server
#
# Usage (in WSL terminal):
#   chmod +x quickstart/start-wsl.sh
#   ./quickstart/start-wsl.sh
#
# Optional: pass a custom repo URL as first argument
#   ./quickstart/start-wsl.sh https://github.com/your-fork/yashoncodex.git
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_URL="${1:-https://github.com/yashmunot18/yashoncodex.git}"
REPO_DIR="$HOME/yashoncodex"
DB_USER="ndc_user"
DB_PASS="ndc_pass"
DB_NAME="ndc_qms"

info()  { echo -e "\033[0;36m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[0;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[0;33m[WARN]\033[0m  $*"; }

# ── 1. System packages ────────────────────────────────────────────────────
info "Updating apt package lists..."
sudo apt-get update -y

info "Installing git, build-essential, Postgres, Redis..."
sudo apt-get install -y git build-essential postgresql postgresql-contrib redis-server curl

# Install Node 20 only if not already at v20+
if node --version 2>/dev/null | grep -q "^v20"; then
    ok "Node 20 already installed ($(node --version))."
else
    info "Installing Node.js 20 via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ok "Node installed: $(node --version)"
fi

# ── 2. Start services ────────────────────────────────────────────────────
info "Starting PostgreSQL..."
sudo service postgresql start || warn "PostgreSQL may already be running."

info "Starting Redis..."
sudo service redis-server start || warn "Redis may already be running."

# ── 3. Create DB role and database (idempotent) ──────────────────────────
info "Ensuring DB role '$DB_USER' exists..."
if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    ok "Role '$DB_USER' already exists."
else
    sudo -u postgres psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';"
    ok "Created role '$DB_USER'."
fi

info "Ensuring database '$DB_NAME' exists..."
if sudo -u postgres psql -lqt | cut -d'|' -f1 | grep -qw "$DB_NAME"; then
    ok "Database '$DB_NAME' already exists."
else
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    ok "Created database '$DB_NAME'."
fi

# ── 4. Clone or update repository ───────────────────────────────────────
if [ ! -d "$REPO_DIR" ]; then
    info "Cloning repository into $REPO_DIR ..."
    git clone "$REPO_URL" "$REPO_DIR"
    ok "Repository cloned."
else
    info "Repository already exists. Pulling latest changes..."
    cd "$REPO_DIR"
    git fetch origin
    git checkout main || warn "Could not switch to main branch."
    git pull origin main || warn "Could not pull latest — continuing with local copy."
    ok "Repository updated."
fi

cd "$REPO_DIR"

# ── 5. Set up .env ───────────────────────────────────────────────────────
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    # Point DATABASE_URL at the local Postgres (not Docker host)
    sed -i "s|postgresql://ndc_user:ndc_pass@postgres:|postgresql://$DB_USER:$DB_PASS@localhost:|g" .env
    ok "Copied .env.example → .env (DATABASE_URL updated for local Postgres)."
    info "Edit .env to set RECEPTION_PROXY_BASE_URL / RECEPTION_PROXY_API_KEY if needed."
elif [ -f .env ]; then
    ok ".env already exists — leaving it unchanged."
else
    warn ".env.example not found. Please check the repository."
fi

# ── 6. Build and start API ───────────────────────────────────────────────
info "Installing API dependencies..."
cd "$REPO_DIR/apps/api"
npm install

info "Building API..."
npm run build

info "Running Prisma migrations..."
npx prisma migrate deploy || warn "Prisma migrate deploy had warnings — continuing."

info "Running Prisma seed..."
npx prisma db seed || warn "Prisma seed had warnings — continuing."

info "Starting API in background..."
nohup node dist/index.js >> "$REPO_DIR/apps/api.out" 2>&1 &
API_PID=$!
ok "API started (PID $API_PID). Logs: $REPO_DIR/apps/api.out"

# ── 7. Build and start web ───────────────────────────────────────────────
info "Installing web dependencies..."
cd "$REPO_DIR/apps/web"
npm install

info "Building web (Next.js)..."
npm run build

info "Starting web server in background..."
nohup npm run start >> "$REPO_DIR/apps/web.out" 2>&1 &
WEB_PID=$!
ok "Web started (PID $WEB_PID). Logs: $REPO_DIR/apps/web.out"

# ── Done ─────────────────────────────────────────────────────────────────
echo ""
ok "All services started!"
echo -e "  Web app    → \033[0;36mhttp://localhost:3000\033[0m"
echo -e "  API health → \033[0;36mhttp://localhost:4000/health\033[0m"
echo ""
info "To view logs:"
echo "  tail -f $REPO_DIR/apps/api.out"
echo "  tail -f $REPO_DIR/apps/web.out"
info "To stop services:"
echo "  kill $API_PID $WEB_PID"
