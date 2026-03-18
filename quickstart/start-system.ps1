<#
.SYNOPSIS
    One-click helper to clone/pull the yashoncodex repo and start it with Docker Compose.

.DESCRIPTION
    Safe, non-destructive script for Windows users.
    - Clones the repo if it does not exist, or pulls the latest changes if it does.
    - Creates .env from .env.example (backs up an existing .env first).
    - Prunes Docker builder cache to avoid stale-layer issues.
    - Runs docker compose up --build.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\quickstart\start-system.ps1

.NOTES
    Requirements: Git for Windows, Docker Desktop (running).
    Run from any folder — the script places the repo in the current directory.
#>

param(
    [string]$RepoUrl  = "https://github.com/yashmunot18/yashoncodex.git",
    [string]$RepoPath = "$PWD\yashoncodex",
    [string]$Branch   = "main"
)

function Write-Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green  }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan   }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR]  $msg" -ForegroundColor Red    }

# ── 1. Check prerequisites ─────────────────────────────────────────────────
Write-Info "Checking prerequisites..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "Git not found. Install Git for Windows (https://git-scm.com) and re-run."
    exit 1
}
Write-Ok "Git found."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker not found. Install Docker Desktop (https://www.docker.com/products/docker-desktop/) and re-run."
    Write-Info "Alternatively, open WSL and run:  chmod +x quickstart/start-wsl.sh && ./quickstart/start-wsl.sh"
    exit 1
}
Write-Ok "Docker found."

# ── 2. Clone or update repository ─────────────────────────────────────────
if (-not (Test-Path -Path $RepoPath)) {
    Write-Info "Cloning repository into $RepoPath ..."
    git clone $RepoUrl $RepoPath
    if ($LASTEXITCODE -ne 0) { Write-Err "Git clone failed. Check your internet connection."; exit 1 }
    Write-Ok "Repository cloned."
} else {
    Write-Info "Repository already exists at $RepoPath. Pulling latest from branch '$Branch' ..."
    Push-Location $RepoPath
    git fetch origin
    git checkout $Branch 2>$null
    git pull origin $Branch
    Pop-Location
    Write-Ok "Repository updated."
}

# ── 3. Copy .env (back up existing) ───────────────────────────────────────
$envFile    = Join-Path $RepoPath ".env"
$envExample = Join-Path $RepoPath ".env.example"

if (Test-Path -Path $envExample) {
    if (Test-Path -Path $envFile) {
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        $backup    = "$envFile.bak.$timestamp"
        Copy-Item -Path $envFile -Destination $backup -Force
        Write-Ok "Backed up existing .env → .env.bak.$timestamp"
    }
    Copy-Item -Path $envExample -Destination $envFile -Force
    Write-Ok "Copied .env.example → .env"
    Write-Info "Open $envFile and set RECEPTION_PROXY_BASE_URL / RECEPTION_PROXY_API_KEY if you have them."
    Write-Info "(You can skip this and test without a reception proxy.)"
} else {
    Write-Warn ".env.example not found. Make sure you are running from the correct repository."
}

# ── 4. Prune Docker builder cache (avoids stale-layer build errors) ────────
Write-Info "Pruning Docker builder cache (safe)..."
docker builder prune -f
Write-Ok "Builder cache pruned."

# ── 5. Start with Docker Compose ──────────────────────────────────────────
Set-Location $RepoPath
Write-Info "Starting services (building images). First run may take 3-5 minutes..."
docker compose up --build

Write-Ok "Done. If services started successfully, open:"
Write-Host "  Web app   → http://localhost:3000"         -ForegroundColor Cyan
Write-Host "  API health→ http://localhost:4000/health"  -ForegroundColor Cyan
Write-Info "To stop:  docker compose down"
Write-Info "For logs: docker compose logs -f api"
