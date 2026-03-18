# NDC Diagnostic Centre – Queue Management System

A production-ready, Dockerized end-to-end queue management system for **NDC DIAGNOSTIC CENTRE (Centre: THANE)**.

---

## What this system does

- **Reception Integration** – Fetches patient registrations from your reception proxy using an API key
- **Dynamic Queue Management** – Automatically routes patients through rooms (Sonography, Blood Collection, X-Ray, etc.)
- **4 Distinct Views** – Floor Manager, Room Technician, Patient Mobile, TV Display
- **Admin Panel** – Non-technical staff can add/edit rooms, tests, and test-to-room assignments
- **Sonography Slot Logic** – "Not Ready" (bladder not full) support with configurable wait time
- **White Professional UI** – Clean, responsive design

---

## Deploy to Railway (Cloud Hosting)

Want to run this system on the internet instead of your local PC? Railway makes it easy — no server setup required.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step guide, including:
- Creating Postgres and Redis add-ons with one click
- Setting `RECEPTION_PROXY_BASE_URL` and `RECEPTION_PROXY_API_KEY` securely
- Build and start commands for both `api` and `web` services
- How to connect your GitHub repository and trigger deploys

---

## Quick Start (5 steps) — Local / Windows

### Step 1 – Prerequisites
Make sure you have installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free)
- That's it!

### Step 2 – Clone the repository
```bash
git clone https://github.com/yashmunot18/yashoncodex.git
cd yashoncodex
```

### Step 3 – Set up environment
```bash
# Copy the example environment file
cp .env.example .env
```

Open `.env` in any text editor (even Notepad) and fill in:
```
RECEPTION_PROXY_BASE_URL=https://your-reception-software-url.com
RECEPTION_PROXY_API_KEY=your-api-key-here
```
> **Note**: You can skip this for now and test the system without connecting the reception proxy.

### Step 4 – Start the system
```bash
docker compose up --build
```
> First time will take 3–5 minutes to download and build. Subsequent starts are fast.

### Step 5 – Open in browser
| View | URL |
|------|-----|
| 🏠 Home / Role Selector | http://localhost:3000 |
| 🏢 Floor Manager | http://localhost:3000/floor |
| 🩺 Room Technician | http://localhost:3000/room |
| 📱 Patient Status | http://localhost:3000/patient |
| 📺 TV Display | http://localhost:3000/tv |
| ⚙️ Admin Panel | http://localhost:3000/admin |
| 🔧 API Health Check | http://localhost:4000/health |
| 📚 API Documentation | http://localhost:4000/docs |

---

## What's pre-loaded (Seed Data)

When the system starts for the first time, it automatically creates:

**Company:** NDC DIAGNOSTIC CENTRE  
**Centre:** THANE

**Rooms:**
1. Sonography
2. Blood Collection
3. Stress Test Treadmill
4. Mammography
5. X-Ray
6. Consultation 1
7. Consultation 2
8. Eye / Hearing Basic Test

**Tests:** USG Abdomen, USG Pelvis, USG Whole Abdomen & Pelvis, USG Thyroid, USG Breast, CBC, LFT, KFT, Lipid Profile, Treadmill Stress Test (TMT), Mammography, X-Ray Chest, X-Ray Knee, X-Ray Spine, Physician Consultation, Eye & Hearing Basic Test

---

## How to use the system

### Floor Manager
- Open http://localhost:3000/floor
- See all rooms, queue lengths, and patient counts
- Click "Sync Reception" to manually pull new registrations
- Click "Open →" to jump to any room's technician view

### Room Technician
- Open http://localhost:3000/room
- Select your room from the dropdown
- **Call** → announces patient
- **Start** → begins test
- **Complete** → finishes test and auto-routes patient to next test
- **Not Ready** (Sonography) → pauses patient for configured minutes

### Patient
- Open http://localhost:3000/patient
- Enter registration number
- See all tests, current queue position, and preparation instructions

### TV Display
- Open http://localhost:3000/tv on a large screen TV
- Shows "Now Serving" and "Up Next" for all rooms
- Auto-refreshes every 8 seconds

### Admin Panel
- Open http://localhost:3000/admin
- **Manage Rooms** – Add/edit rooms, set display order
- **Manage Tests** – Add/edit diagnostic tests with prep instructions
- **Test → Room Mapping** – Assign which test happens in which room
- **Center Settings** – Configure wait times, auto-routing, etc.

---

## Adding a new patient manually (for testing)

You can add a test registration via the API:

```bash
curl -X POST http://localhost:4000/api/sync/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "registrations": [{
      "id": "TEST-001",
      "patientName": "Rahul Sharma",
      "patientAge": 35,
      "patientGender": "Male",
      "patientPhone": "9876543210",
      "registrationNo": "NDC-2024-001",
      "tests": ["USG-ABD", "CBC", "XR-CHEST"],
      "visitDate": "'"$(date +%Y-%m-%d)"'"
    }]
  }'
```

---

## Windows PowerShell Setup Script

If you are on Windows and want to run everything in one shot, save the script below as `setup.ps1` anywhere on your PC and run it in PowerShell:

```powershell
# NDC QMS – Windows PowerShell one-shot setup script
# Run from any folder. Requires Docker Desktop to be running.

# If you forked the repository, replace the URL below with your own fork's URL:
$repoUrl   = "https://github.com/yashmunot18/yashoncodex.git"
$targetDir = "$env:USERPROFILE\ndc-qms"

Write-Host "== NDC QMS Setup ==" -ForegroundColor Cyan

# 1. Clone (skip if already present)
if (-Not (Test-Path $targetDir)) {
    Write-Host "Cloning repository to $targetDir ..." -ForegroundColor Yellow
    git clone $repoUrl $targetDir
} else {
    Write-Host "Repository already exists at $targetDir — pulling latest..." -ForegroundColor Yellow
    Set-Location $targetDir
    git pull origin main
}

Set-Location $targetDir

# 2. Create .env from example (skip if already exists)
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example ..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "ACTION NEEDED: Open .env in Notepad and fill in:" -ForegroundColor Green
    Write-Host "  RECEPTION_PROXY_BASE_URL=https://your-reception-url.com"
    Write-Host "  RECEPTION_PROXY_API_KEY=your-api-key"
    Write-Host "(You can leave these blank to test without the reception proxy)" -ForegroundColor Gray
    Write-Host ""
    notepad .env
    Read-Host "Press ENTER when you have saved .env and are ready to continue"
} else {
    Write-Host ".env already exists — skipping." -ForegroundColor Gray
}

# 3. Clean Docker state
Write-Host "Cleaning Docker state..." -ForegroundColor Yellow
docker compose down -v 2>$null
docker builder prune -f 2>$null

# 4. Build and start
Write-Host "Building and starting services (this may take 3-5 minutes the first time)..." -ForegroundColor Yellow
docker compose up --build

# 5. Done
Write-Host ""
Write-Host "== System is running! Open these URLs in your browser: ==" -ForegroundColor Cyan
Write-Host "  Home:          http://localhost:3000"
Write-Host "  Floor Manager: http://localhost:3000/floor"
Write-Host "  Room View:     http://localhost:3000/room"
Write-Host "  Patient View:  http://localhost:3000/patient"
Write-Host "  TV Display:    http://localhost:3000/tv"
Write-Host "  Admin Panel:   http://localhost:3000/admin"
Write-Host "  API Health:    http://localhost:4000/health"
Write-Host ""
Write-Host "Press Ctrl+C to stop the system." -ForegroundColor Gray
```

To run it:
```powershell
# Option A – run directly from PowerShell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1

# Option B – right-click setup.ps1 → "Run with PowerShell"
```

---

## Troubleshooting

### ❌ Port conflict (port 3000 or 4000 already in use)
Edit `.env` and change:
```
API_PORT=4001
WEB_PORT=3001
```
Then run `docker compose up --build` again.

### ❌ Database migration failed
```bash
docker compose down -v  # WARNING: This deletes all data
docker compose up --build
```

### ❌ "Cannot connect to Docker daemon"
Make sure Docker Desktop is running (look for the whale icon in your taskbar).

### ❌ Reception sync returns 0 results
- Check that `RECEPTION_PROXY_BASE_URL` and `RECEPTION_PROXY_API_KEY` are set in `.env`
- The proxy must return data in the expected format (see API docs at http://localhost:4000/docs)
- You can test without the proxy using the manual registration above

### ❌ Web app shows "Failed to load"
- Wait 30 seconds for the API to fully start
- Check API is running: http://localhost:4000/health
- Check Docker logs: `docker compose logs api`

### View logs
```bash
docker compose logs -f          # All services
docker compose logs -f api      # API only
docker compose logs -f web      # Web only
docker compose logs -f postgres # Database only
```

### Stop the system
```bash
docker compose down
```

### Stop and delete all data (fresh start)
```bash
docker compose down -v
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐   │
│  │  Next.js │   │ Fastify  │   │  PostgreSQL  │   │
│  │   Web    │──▶│   API    │──▶│   Database   │   │
│  │ :3000    │   │  :4000   │   │    :5432     │   │
│  └──────────┘   └──────────┘   └──────────────┘   │
│                      │          ┌──────────────┐   │
│                      └─────────▶│    Redis     │   │
│                                 │    :6379     │   │
│                                 └──────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Fastify + TypeScript + Prisma ORM
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Container:** Docker + Docker Compose

**Key design decisions:**
- Config-driven: all rooms, tests, mappings editable from Admin UI (no code change)
- Center-based architecture: ready for multi-center expansion
- Idempotent sync: re-running sync never creates duplicate patients/visits
- Auto-routing: patients automatically progress to next test after completion

---

## API Reference

All endpoints are documented at **http://localhost:4000/docs** (Swagger UI).

Key endpoints:
```
GET  /health                          – System health check
POST /api/sync/trigger                – Trigger registration sync
POST /api/sync/webhook                – Push registrations directly
GET  /api/floor/dashboard             – Floor manager data
GET  /api/queue/rooms/:roomId         – Room queue
POST /api/queue/:entryId/call         – Call patient
POST /api/queue/:entryId/start        – Start test
POST /api/queue/:entryId/complete     – Complete test
POST /api/queue/:entryId/not-ready    – Mark not ready (sonography)
GET  /api/patient/:visitId/status     – Patient test status
GET  /api/display/tv                  – TV board data
GET  /api/display/floor               – Floor display data
GET  /api/admin/rooms                 – List rooms (CRUD)
GET  /api/admin/tests                 – List tests (CRUD)
GET  /api/admin/mappings              – List mappings (CRUD)
GET  /api/admin/settings              – Center settings
```

---

## Extending for other centres

To add a new centre:
1. Insert a new row in `Center` table via Admin or API
2. Add rooms and tests for that centre
3. The system is designed for multi-centre – each entity is scoped by `centerId`

---

*Built for NDC Diagnostic Centre, Thane | v1.0*
