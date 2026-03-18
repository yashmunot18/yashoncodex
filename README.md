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

## Super Simple Quickstart

Not technical? No problem. See **[quickstart/README_QUICKSTART.md](quickstart/README_QUICKSTART.md)** for three zero-friction options:

| Option | Best for | What you need |
|--------|----------|---------------|
| ☁️ **Railway (managed cloud)** | Absolute beginners — recommended | A Railway account (free) |
| 🐳 **Docker Desktop (Windows)** | Anyone with Docker installed | Git + Docker Desktop |
| 🐧 **WSL local install** | Developers on Windows without Docker | WSL / Ubuntu |

> **Recommended for non-technical users:** Use Railway — one-click managed Postgres + Redis, no local installs required.

---

## Quick Start (5 steps)

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

## Managed Deployment (Railway)

> **No Docker or command line required.**  Railway is a cloud platform that builds and runs the system for you.  All you need is a browser and a GitHub account.

### Step 1 – Create a Railway account
1. Go to [railway.app](https://railway.app) and click **Login**.
2. Choose **Login with GitHub** and authorize Railway to access your account.

### Step 2 – Create a new project and connect the repository
1. In the Railway dashboard click **+ New Project**.
2. Select **Deploy from GitHub repo**.
3. Search for **yashmunot18/yashoncodex** (or your own fork) and click **Deploy Now**.
4. When prompted, select the **main** branch.
   Railway will detect the two services (`api` and `web`) automatically.

### Step 3 – Provision Postgres and Redis add-ons
1. Inside your project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Click **+ New** → **Database** → **Add Redis**.
   Railway will create `DATABASE_URL` and `REDIS_URL` environment variables and share them with your services automatically.

### Step 4 – Set your environment variables
For each service that needs them, open the service → **Variables** tab and add:

| Variable | Where to find the value |
|---|---|
| `DATABASE_URL` | Auto-filled by Railway Postgres add-on |
| `REDIS_URL` | Auto-filled by Railway Redis add-on |
| `RECEPTION_PROXY_BASE_URL` | URL of your reception software API |
| `RECEPTION_PROXY_API_KEY` | API key from your reception software provider |
| `API_PORT` | Set to `4000` |
| `WEB_PORT` | Set to `3000` |

> See `.railway/config.example.env` for the full list of variable names.  
> ⚠️ **Never share or commit real API keys or database passwords.**

### Step 5 – Trigger the first deployment
Railway automatically builds and deploys every time you push to **main**.  
To trigger manually: open the service → **Deployments** tab → click **Deploy**.

Build logs appear in real time.  A green ✓ means the service is live.

### Step 6 – Find your public URLs
1. Open the **api** service → **Settings** tab → copy the **Public Domain** (e.g. `api-xxx.railway.app`).
2. Open the **web** service → **Settings** → copy its public domain.
3. Set the web service variable `NEXT_PUBLIC_API_URL` to `https://<your-api-domain>` (no trailing slash).

### Step 7 – First-run checklist
- [ ] `https://<api-domain>/health` returns `{"status":"ok"}`
- [ ] `https://<web-domain>` loads the home / role-selector page
- [ ] Floor Manager, Room Technician, TV Display views all load correctly
- [ ] Admin Panel at `/admin` shows the pre-loaded rooms and tests

### Manual test – add a registration via API
Replace `<api-domain>` with your Railway API domain:

```bash
curl -X POST https://<api-domain>/api/sync/webhook \
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
      "visitDate": "2024-01-01"
    }]
  }'
```

A `200` response confirms the API and database are connected correctly.

### Rolling back or stopping the project
- **Rollback:** Open the service → **Deployments** tab → click the three-dot menu on a previous deployment → **Rollback**.
- **Stop (pause billing):** Open **Project Settings** → **Danger Zone** → **Suspend Project**.
- **Delete:** Open **Project Settings** → **Danger Zone** → **Delete Project** (⚠️ permanent — deletes all data).

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
