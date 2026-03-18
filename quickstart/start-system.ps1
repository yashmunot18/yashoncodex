# ============================================================
#  NDC QMS – One-Click Windows Quickstart (PowerShell)
#  Run:  powershell -ExecutionPolicy Bypass -File start-system.ps1
# ============================================================
#  What this script does (safe, non-destructive):
#    1. Checks that Docker Desktop is installed and running
#    2. Copies .env.example → .env (only if .env doesn't exist yet)
#    3. Prunes the Docker builder cache to avoid stale-layer errors
#    4. Runs: docker compose up --build
#
#  Nothing is deleted. No passwords or secrets are hard-coded.
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  NDC QMS – Super Simple Windows Quickstart" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Docker ──────────────────────────────────
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue

if (-not $dockerCmd) {
    Write-Host ""
    Write-Host "  ✗ Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Options:" -ForegroundColor White
    Write-Host "  A) Install Docker Desktop (recommended):" -ForegroundColor White
    Write-Host "     https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  B) Use WSL (Windows Subsystem for Linux) instead:" -ForegroundColor White
    Write-Host "     1. Open PowerShell as Administrator and run:  wsl --install" -ForegroundColor White
    Write-Host "     2. Reboot when prompted." -ForegroundColor White
    Write-Host "     3. Open the Ubuntu app, navigate to this folder, and run:" -ForegroundColor White
    Write-Host "        bash quickstart/start-wsl.sh" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  After installing Docker Desktop, re-run this script." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Verify Docker daemon is actually running
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  ✗ Docker is installed but the Docker daemon is not running." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Fix: Open Docker Desktop (look for the whale icon in your taskbar)." -ForegroundColor Yellow
    Write-Host "  Wait until it says 'Docker Desktop is running', then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host "  ✓ Docker is running." -ForegroundColor Green

# ── Step 2: Set up .env ───────────────────────────────────
Write-Host ""
Write-Host "[2/4] Setting up environment file..." -ForegroundColor Yellow

# Navigate to the repo root (parent of this quickstart folder)
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot   = Split-Path -Parent $scriptDir

Set-Location $repoRoot

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  ✓ Created .env from .env.example" -ForegroundColor Green
        Write-Host "  ℹ  Optional: open .env in Notepad to add your RECEPTION_PROXY_* keys." -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ .env.example not found. Are you running this from the correct folder?" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✓ .env already exists – keeping it as-is." -ForegroundColor Green
}

# ── Step 3: Prune builder cache ───────────────────────────
Write-Host ""
Write-Host "[3/4] Pruning Docker builder cache (avoids stale-layer errors)..." -ForegroundColor Yellow
docker builder prune -f | Out-Null
Write-Host "  ✓ Builder cache cleared." -ForegroundColor Green

# ── Step 4: Build and start ───────────────────────────────
Write-Host ""
Write-Host "[4/4] Building and starting all services (first run takes 3-5 minutes)..." -ForegroundColor Yellow
Write-Host "  ℹ  You will see build output below. When it stops scrolling, the system is ready." -ForegroundColor Cyan
Write-Host ""

docker compose up --build

# If we get here docker compose exited (user pressed Ctrl+C or error)
Write-Host ""
Write-Host "────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  System stopped. To restart later, run:" -ForegroundColor White
Write-Host "    docker compose up" -ForegroundColor Cyan
Write-Host "  To stop and remove containers:" -ForegroundColor White
Write-Host "    docker compose down" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────" -ForegroundColor Cyan
