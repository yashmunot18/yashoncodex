# NDC QMS – Super Simple Quickstart

> **You do not need to be technical to run this system.**  
> Pick the option that sounds easiest for you below.

---

## Which option should I choose?

| Your situation | Best option |
|---|---|
| I just want to see it running, I don't care where | **Option A – Railway (Cloud)** |
| I have Docker Desktop installed on Windows | **Option B – PowerShell script** |
| I don't want Docker but I have (or can install) WSL on Windows | **Option C – WSL script** |

---

## Option A – Railway (Cloud) — Easiest, no local install needed

Railway is a free-tier cloud platform. The app runs on their servers, not on your PC.

**Steps (click-by-click):**

1. Go to **https://railway.app** and create a free account (sign in with GitHub is easiest).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Authorize Railway to access your GitHub account, then select **yashmunot18/yashoncodex**.
4. Railway will scan the project. You will then:
   - Click **Add a Service** → **Database** → **Add PostgreSQL**
   - Click **Add a Service** → **Database** → **Add Redis**
5. For each of the two app services (api and web), go to **Settings → Environment Variables** and add:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | *(copy from the Postgres add-on — Railway fills this automatically)* |
   | `REDIS_URL` | *(copy from the Redis add-on — Railway fills this automatically)* |
   | `API_PORT` | `4000` |
   | `WEB_PORT` | `3000` |
   | `NODE_ENV` | `production` |
   | `RECEPTION_PROXY_BASE_URL` | *(leave blank if you don't have it yet)* |
   | `RECEPTION_PROXY_API_KEY` | *(leave blank if you don't have it yet)* |

6. Click **Deploy**. Wait 3–5 minutes.
7. Railway shows you a public URL — open it in your browser. Done! 🎉

**What you get:** A fully working URL anyone can open, no PC required.

---

## Option B – Docker Desktop on Windows (Recommended for local use)

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.  
If you don't have it, download and install it (free, ~600 MB), then come back here.

**One command to start everything:**

1. Open **PowerShell** (search "PowerShell" in Start Menu — no need for Administrator).
2. Navigate to the folder where you cloned/downloaded this project:
   ```powershell
   cd C:\path\to\yashoncodex
   ```
3. Run the quickstart script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File quickstart\start-system.ps1
   ```
4. The first run takes **3–5 minutes** (it downloads and builds everything).  
   You will see output scrolling by — that's normal.
5. When it stops scrolling, open your browser:

   | What | Where |
   |---|---|
   | 🏠 Main app | http://localhost:3000 |
   | ⚙️ Admin panel | http://localhost:3000/admin |
   | 🔧 API health | http://localhost:4000/health |

**To stop the system:**
```powershell
docker compose down
```

**To restart later (much faster, no rebuild):**
```powershell
docker compose up
```

> **Note:** The script will offer WSL instructions if Docker is not found.

---

## Option C – WSL (Windows Subsystem for Linux) — No Docker needed

WSL lets you run Linux commands on Windows. If you don't have it:

1. Open **PowerShell as Administrator** (right-click → Run as Administrator):
   ```powershell
   wsl --install
   ```
2. Reboot when asked, then open the **Ubuntu** app from the Start Menu.

**Once inside the WSL Ubuntu terminal:**

1. Navigate to the project (replace the path with where you cloned it):
   ```bash
   cd /mnt/c/Users/YourName/yashoncodex
   ```
   *(Tip: your Windows `C:\Users\YourName` is `/mnt/c/Users/YourName` inside WSL)*

2. Run the start script:
   ```bash
   bash quickstart/start-wsl.sh
   ```

3. The script will:
   - Install Node 20, PostgreSQL, and Redis automatically (safe, won't break anything)
   - Set up the database
   - Build and start the API and Web

4. When done, open your browser:

   | What | Where |
   |---|---|
   | 🏠 Main app | http://localhost:3000 |
   | 🔧 API health | http://localhost:4000/health |

**To stop:**
```bash
kill $(cat /tmp/ndc_api.pid) $(cat /tmp/ndc_web.pid)
```

**To restart later:**
```bash
cd apps/api && node dist/index.js &
cd ../web && npm run start &
```

---

## Testing that it works (add a test patient)

Once the system is running, paste this into your terminal to add a test patient:

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
      "visitDate": "2024-01-15"
    }]
  }'
```

Then open http://localhost:3000/floor to see the floor manager dashboard.

---

## Common questions

**"The script says Docker is not running"**  
Open Docker Desktop from the Start Menu and wait for it to show "Docker Desktop is running" (look for the whale icon in the system tray).

**"Port 3000 or 4000 is already in use"**  
Open `.env` and change `WEB_PORT=3001` and/or `API_PORT=4001`, then restart.

**"I want to connect my reception software"**  
Open `.env` and fill in:
```
RECEPTION_PROXY_BASE_URL=https://your-reception-url.com
RECEPTION_PROXY_API_KEY=your-key-here
```
Then restart the system.

**"I need to start fresh (delete all data)"**  
```bash
docker compose down -v   # WARNING: deletes all patient data
docker compose up --build
```

---

*For the full technical documentation, see the main [README.md](../README.md).*
