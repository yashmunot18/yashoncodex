# Super Simple Quickstart (for non-technical users)

This folder contains one-click scripts so you can try the **NDC Queue Management System** in minutes — no technical background needed.

Pick **one** of the three options below.

---

## Option A — Managed Cloud (Railway) ☁️ — Easiest, recommended

No local installs. Railway gives you a managed Postgres + Redis and a public URL for free.

**Steps:**
1. Create a free account at <https://railway.app> and sign in.
2. Click **New Project → Deploy from GitHub repo** and authorise this repository.
3. Railway will detect the services automatically.
4. Add two add-ons from the Railway dashboard:
   - **PostgreSQL** (copies `DATABASE_URL` into your env automatically)
   - **Redis** (copies `REDIS_URL` into your env automatically)
5. Set these environment variables in **Railway → Project → Variables**:
   ```
   API_PORT=4000
   WEB_PORT=3000
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=<your-deployed-api-public-url>   # fill in after first deploy
   RECEPTION_PROXY_BASE_URL=                            # optional
   RECEPTION_PROXY_API_KEY=                             # optional
   ```
6. Click **Deploy**. Railway builds and starts everything.
7. Once deployed, open the public URL shown in the Railway dashboard.

> **Safety note:** Never paste secrets into this repository. Set them only in the Railway dashboard.

---

## Option B — Docker Desktop (Windows) 🐳 — Simple if you have Docker

**Requirements:** [Git for Windows](https://git-scm.com) + [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free, running).

**One-liner command** (open PowerShell, paste and press Enter):

```powershell
powershell -ExecutionPolicy Bypass -File .\quickstart\start-system.ps1
```

**What the script does:**
- Clones the repo into the current folder (or pulls latest if already cloned).
- Backs up your existing `.env` and creates a fresh one from `.env.example`.
- Prunes the Docker builder cache (avoids stale-layer errors).
- Runs `docker compose up --build` — builds and starts all services.

**After successful start, open:**
| | URL |
|---|---|
| Web app | <http://localhost:3000> |
| API health | <http://localhost:4000/health> |

**To stop:**
```powershell
docker compose down
```

---

## Option C — WSL Local Install (Ubuntu) 🐧 — Best if you don't want Docker

**Requirements:** Windows Subsystem for Linux (WSL) with Ubuntu installed.

**Commands** (open your WSL / Ubuntu terminal):

```bash
# Download the script (first time only)
chmod +x ~/yashoncodex/quickstart/start-wsl.sh

# Run it
~/yashoncodex/quickstart/start-wsl.sh
```

Or, to clone and run in one go:

```bash
git clone https://github.com/yashmunot18/yashoncodex.git ~/yashoncodex
chmod +x ~/yashoncodex/quickstart/start-wsl.sh
~/yashoncodex/quickstart/start-wsl.sh
```

**What the script does:**
- Installs Node 20, PostgreSQL, Redis (skips if already installed).
- Creates the DB role `ndc_user` and database `ndc_qms` (skips if already created).
- Clones the repo or pulls the latest changes.
- Builds the API and web, runs Prisma migrations and seed data.
- Starts the API and web server in the background.

**After successful start, open:**
| | URL |
|---|---|
| Web app | <http://localhost:3000> |
| API health | <http://localhost:4000/health> |

**To view logs:**
```bash
tail -f ~/yashoncodex/apps/api.out
tail -f ~/yashoncodex/apps/web.out
```

---

## Manual test — inject a patient registration

Once the system is running, test it by injecting a sample registration:

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
      "registrationNo": "NDC-2026-001",
      "tests": ["USG-ABD", "CBC"],
      "visitDate": "2026-03-18"
    }]
  }'
```

Then open <http://localhost:3000/floor> to see the patient appear in the queue.

---

## Safety notes

- These scripts are **non-destructive** — they never delete your data or overwrite secrets.
- Your existing `.env` is backed up before being replaced (Docker option).
- No credentials are stored in this repository. Set secrets in your cloud dashboard only.
- If anything goes wrong, check the logs or open an issue on GitHub.
