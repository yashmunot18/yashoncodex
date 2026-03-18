<#
.SYNOPSIS
    NDC Diagnostic Centre – Queue Management System
    One-command Windows setup script (Steps 1–6).

.DESCRIPTION
    This script automates the full local setup on Windows:
      Step 1 – Go to the project folder (clones if missing, pulls if present)
      Step 2 – Create the .env file from .env.example
      Step 3 – Remove any accidentally nested clone
      Step 4 – Clean Docker state (volumes + build cache)
      Step 5 – Build and start all services with Docker Compose
      Step 6 – Show service status and open URLs

.EXAMPLE
    # Run from PowerShell (right-click → "Run with PowerShell"):
    .\scripts\setup-windows.ps1

    # If you get "execution policy" error, run this first in Admin PowerShell:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#>

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/yashmunot18/yashoncodex.git"
$RepoDir = Join-Path $env:USERPROFILE "yashoncodex"

# ─── Helpers ───────────────────────────────────────────────────────────────────
function Write-Step($n, $msg) {
    Write-Host ""
    Write-Host "[$n/6] $msg" -ForegroundColor Cyan
}

function Write-Info($msg)  { Write-Host "      $msg" -ForegroundColor Gray }
function Write-Ok($msg)    { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host " WARN $msg" -ForegroundColor Yellow }

# ─── Pre-flight: check Docker ──────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor White
Write-Host "║  NDC Diagnostic Centre – Queue Management System Setup  ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor White
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host " ERROR: Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "        Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    Write-Host "        Then re-run this script." -ForegroundColor Red
    exit 1
}

try {
    docker info *>$null
    Write-Ok "Docker Desktop is running."
} catch {
    Write-Host " ERROR: Docker daemon is not running." -ForegroundColor Red
    Write-Host "        Start Docker Desktop (look for the whale icon in your taskbar) and try again." -ForegroundColor Red
    exit 1
}

# ─── Step 1: Clone or update repository ───────────────────────────────────────
Write-Step 1 "Set up repository at $RepoDir"

if (Test-Path (Join-Path $RepoDir ".git")) {
    Write-Info "Repository already exists. Pulling latest changes..."
    Push-Location $RepoDir
    git pull origin main
    Pop-Location
    Write-Ok "Repository updated."
} else {
    Write-Info "Cloning repository..."
    Set-Location $env:USERPROFILE
    git clone $RepoUrl
    Write-Ok "Repository cloned to $RepoDir"
}

Set-Location $RepoDir

# ─── Step 2: Create .env file ─────────────────────────────────────────────────
Write-Step 2 "Create .env configuration file"

if (Test-Path ".env") {
    Write-Warn ".env already exists – keeping your existing settings."
    Write-Info "To reset: delete .env and re-run this script."
} else {
    Copy-Item ".env.example" ".env"
    Write-Ok ".env created from .env.example"
    Write-Warn "Optional: open .env in Notepad and set RECEPTION_PROXY_BASE_URL / RECEPTION_PROXY_API_KEY"
    Write-Info "You can skip this now and test without the reception proxy."
}

# ─── Step 3: Remove accidentally nested clone ─────────────────────────────────
Write-Step 3 "Check for nested repository folder"

$nestedDir = Join-Path $RepoDir "yashoncodex"
if (Test-Path $nestedDir) {
    Write-Warn "Found nested clone at $nestedDir – removing..."
    Remove-Item $nestedDir -Recurse -Force
    Write-Ok "Nested clone removed."
} else {
    Write-Ok "No nested clone found."
}

# ─── Step 4: Clean Docker state ───────────────────────────────────────────────
Write-Step 4 "Clean Docker state (volumes + build cache)"

Write-Info "Stopping any running containers..."
docker compose down -v 2>&1 | Out-Null

Write-Info "Pruning build cache..."
docker builder prune -f 2>&1 | Out-Null

Write-Ok "Docker state cleaned."

# ─── Step 5: Build and start all services ─────────────────────────────────────
Write-Step 5 "Build and start NDC QMS (first build takes 3–5 minutes)"

Write-Info "Running: docker compose up --build -d"
Write-Info "Please wait..."
docker compose up --build -d

Write-Ok "Docker Compose started all services in the background."

# ─── Step 6: Show status and URLs ─────────────────────────────────────────────
Write-Step 6 "Service status and URLs"

Write-Host ""
Write-Info "Waiting 15 seconds for services to initialise..."
Start-Sleep -Seconds 15

docker compose ps

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host " NDC QMS is running! Open these URLs in your browser:" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Home / Role Selector  →  http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Admin Panel           →  http://localhost:3000/admin" -ForegroundColor Yellow
Write-Host "  Floor Manager         →  http://localhost:3000/floor" -ForegroundColor Yellow
Write-Host "  Room Technician       →  http://localhost:3000/room" -ForegroundColor Yellow
Write-Host "  Patient Status        →  http://localhost:3000/patient" -ForegroundColor Yellow
Write-Host "  TV Display            →  http://localhost:3000/tv" -ForegroundColor Yellow
Write-Host "  API Health Check      →  http://localhost:4000/health" -ForegroundColor Yellow
Write-Host "  API Documentation     →  http://localhost:4000/docs" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host " Useful commands:" -ForegroundColor White
Write-Host "   Watch all logs:   docker compose logs -f" -ForegroundColor Gray
Write-Host "   Watch API logs:   docker compose logs -f api" -ForegroundColor Gray
Write-Host "   Stop the system:  docker compose down" -ForegroundColor Gray
Write-Host "   Full reset:       docker compose down -v" -ForegroundColor Gray
Write-Host ""
Write-Host " If the web page shows 'Failed to load', wait 30 seconds and refresh." -ForegroundColor DarkGray
Write-Host " The API needs a moment to run database migrations on first start." -ForegroundColor DarkGray
Write-Host ""
