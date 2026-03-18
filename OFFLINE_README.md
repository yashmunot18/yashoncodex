# Offline Preview Guide

You do **not** need Docker, Railway, Node.js, or any cloud service to read the code and sample data in this repository.  Everything can be viewed locally using only a text editor and a web browser.

---

## What changed in this branch

| Change | Why |
|--------|-----|
| `.github/workflows/deploy-template.yml` renamed to `deploy-template.yml.disabled` | Prevents GitHub Actions from triggering a deployment accidentally |
| `docker-compose.yml` renamed to `docker-compose.disabled.yml` | Prevents `docker compose up` from running if someone has Docker installed |
| `.railway/` renamed to `.railway.disabled/` | Prevents Railway from detecting a template in this branch |
| Added `offline_preview/sample_page.html` | Open this in any browser to see linked source files and a sample API response |
| Added `offline_preview/sample_data.json` | Example registration payload you can open in any text editor or browser |

No files were deleted — only renamed or added.

---

## How to download the repository as a ZIP (no Git required)

1. Open this URL in your browser:
   ```
   https://github.com/yashmunot18/yashoncodex/archive/refs/heads/main.zip
   ```
2. Your browser will download a file named **yashoncodex-main.zip** (or similar).
3. Right-click the ZIP file and choose **Extract All** (Windows) or double-click (Mac/Linux).
4. Open the extracted folder — you will see all the files listed below.

---

## How to open files locally

### Open the offline preview page (easiest)
1. Inside the extracted folder, navigate to `offline_preview/`.
2. Double-click **`sample_page.html`** — it opens in your default browser.
3. The page shows a brief description of the project, links to key source files, and a sample API JSON response.

### Open source files in a text editor
Any text editor works.  Recommended free options:

| Program | Platform | Download |
|---------|----------|----------|
| **Notepad** | Windows (built-in) | Already installed |
| **Notepad++** | Windows | https://notepad-plus-plus.org |
| **Visual Studio Code** | Windows / Mac / Linux | https://code.visualstudio.com |
| **TextEdit** | Mac (built-in) | Already installed |
| **gedit** | Linux | Already installed on most distros |

### Open JSON files
- Double-click **`offline_preview/sample_data.json`** — it opens in your browser and shows the formatted JSON.
- Or open it in any text editor listed above.

---

## Key files to inspect

### Web application (Next.js pages)
| File | What it contains |
|------|-----------------|
| `apps/web/src/app/page.tsx` | Home / role-selector page |
| `apps/web/src/app/floor/page.tsx` | Floor Manager view |
| `apps/web/src/app/room/page.tsx` | Room Technician view |
| `apps/web/src/app/patient/page.tsx` | Patient status view |
| `apps/web/src/app/tv/page.tsx` | TV display view |
| `apps/web/src/app/admin/page.tsx` | Admin panel home |
| `apps/web/src/lib/api.ts` | API helper (all endpoint calls) |

### API (Fastify + Prisma)
| File | What it contains |
|------|-----------------|
| `apps/api/src/index.ts` | Server entry point, registers all routes |
| `apps/api/src/routes/health.ts` | `GET /health` endpoint |
| `apps/api/src/routes/sync.ts` | `POST /api/sync/webhook` – receive registrations |
| `apps/api/src/routes/floor.ts` | `GET /api/floor/dashboard` |
| `apps/api/src/routes/queue.ts` | Call / Start / Complete / Not-Ready |
| `apps/api/src/routes/patient.ts` | `GET /api/patient/:visitId/status` |
| `apps/api/src/routes/display.ts` | TV and floor display data |
| `apps/api/prisma/schema.prisma` | Database schema (all tables) |

### Sample data
| File | What it contains |
|------|-----------------|
| `offline_preview/sample_data.json` | Example registration payload |
| `.env.example` | All environment variable names (no real secrets) |

---

## Re-enabling deployment files

If you want to use Docker or Railway later, rename the disabled files back:

**On Windows (PowerShell):**
```powershell
# Re-enable GitHub Actions workflow
Rename-Item .github\workflows\deploy-template.yml.disabled deploy-template.yml

# Re-enable Docker Compose
Rename-Item docker-compose.disabled.yml docker-compose.yml

# Re-enable Railway config
Rename-Item .railway.disabled .railway
```

**On Mac / Linux (Terminal):**
```bash
# Re-enable GitHub Actions workflow
mv .github/workflows/deploy-template.yml.disabled .github/workflows/deploy-template.yml

# Re-enable Docker Compose
mv docker-compose.disabled.yml docker-compose.yml

# Re-enable Railway config
mv .railway.disabled .railway
```

---

## No deployment or hosting is required to read files

All source code and sample data in this repository are plain text files.  You can read, study, and copy them without running any server, Docker container, or cloud service.
