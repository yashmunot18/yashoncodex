# Deploying NDC QMS to Railway

This guide explains how to deploy the NDC Diagnostic Centre Queue Management System to [Railway](https://railway.app) — a fully managed platform-as-a-service that provisions Postgres, Redis, and your Node.js services with zero server management.

---

## Contents

1. [Prerequisites](#prerequisites)
2. [Architecture on Railway](#architecture-on-railway)
3. [Step-by-step deployment](#step-by-step-deployment)
4. [Environment variables reference](#environment-variables-reference)
5. [Setting RECEPTION_PROXY_* values](#setting-reception_proxy-values)
6. [Triggering a new deploy](#triggering-a-new-deploy)
7. [Verifying the deployment](#verifying-the-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A [Railway account](https://railway.app) (free tier is sufficient to start)
- Your GitHub repository forked / pushed to GitHub (already done: `yashmunot18/yashoncodex`)
- No secrets stored in code — all secrets are entered via the Railway Dashboard

---

## Architecture on Railway

```
Railway Project: ndc-qms
│
├── Service: api          (apps/api – Fastify + Prisma, port 4000)
├── Service: web          (apps/web – Next.js 15, port 3000)
├── Plugin:  Postgres     (Railway-managed PostgreSQL 16)
└── Plugin:  Redis        (Railway-managed Redis 7)
```

Railway automatically:
- Provides `DATABASE_URL` to every service when a Postgres plugin is added
- Provides `REDIS_URL` to every service when a Redis plugin is added
- Assigns a public HTTPS domain to each service

---

## Step-by-step deployment

### Step 1 – Create a new Railway project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub account (OAuth — Railway's own authorization, no secrets stored in this repo)
4. Select the repository **`yashmunot18/yashoncodex`** and click **"Deploy Now"**

> Railway will create a project and detect the monorepo. You will manually add each service below.

---

### Step 2 – Add the Postgres plugin

1. Inside your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will provision a Postgres 16 instance and automatically inject `DATABASE_URL` into all services in the project.

---

### Step 3 – Add the Redis plugin

1. Click **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway will provision a Redis 7 instance and automatically inject `REDIS_URL` into all services in the project.

---

### Step 4 – Create the API service

1. Click **"+ New"** → **"GitHub Repo"** → select `yashmunot18/yashoncodex`
2. In the service settings, set the **Root Directory** to `apps/api`
3. Railway will auto-detect Node.js via Nixpacks and use the `railway.json` in `apps/api/`

   The `apps/api/railway.json` already configures:
   ```
   Build:  npm ci && npx prisma generate && npm run build
   Start:  npx prisma migrate deploy && npx prisma db seed && node dist/index.js
   ```

4. Set the **Service Name** to `api`
5. Go to **Variables** and add the environment variables listed in the [reference section](#environment-variables-reference) below

---

### Step 5 – Create the Web service

1. Click **"+ New"** → **"GitHub Repo"** → select `yashmunot18/yashoncodex` again
2. In the service settings, set the **Root Directory** to `apps/web`
3. Railway will use the `railway.json` in `apps/web/`:

   ```
   Build:  npm ci && npm run build
   Start:  node .next/standalone/server.js
   ```

4. Set the **Service Name** to `web`
5. Go to **Variables** and add:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | The public URL of your `api` service (shown in api service settings, e.g. `https://api-production-xxxx.up.railway.app`) |
   | `INTERNAL_API_URL` | The private URL of api inside Railway: `http://api.railway.internal:4000` |
   | `NODE_ENV` | `production` |

---

### Step 6 – Deploy

After adding variables, click **"Deploy"** on each service (or push a commit to `main` — Railway auto-deploys on every push).

First build will take **3–5 minutes**. Subsequent deploys are typically under 2 minutes.

---

## Environment variables reference

### API service variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Auto-injected | Injected by Railway Postgres plugin. Format: `postgresql://USER:PASS@HOST:PORT/DBNAME` |
| `REDIS_URL` | Auto-injected | Injected by Railway Redis plugin. Format: `redis://default:PASS@HOST:PORT` |
| `JWT_SECRET` | **Yes** | Random secret for signing internal tokens. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | **Yes** | Set to `production` |
| `RECEPTION_PROXY_BASE_URL` | Recommended | Base URL of your reception software proxy (see below) |
| `RECEPTION_PROXY_API_KEY` | Recommended | API key from your reception vendor (see below) |
| `RECEPTION_PROXY_TIMEOUT_MS` | Optional | HTTP timeout in ms. Default: `10000` |
| `RECEPTION_POLL_INTERVAL_MS` | Optional | Polling interval in ms. Default: `60000` |

### Web service variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Public HTTPS URL of the api Railway service |
| `INTERNAL_API_URL` | Recommended | Private URL for server-side Next.js calls: `http://api.railway.internal:4000` |
| `NODE_ENV` | **Yes** | Set to `production` |

---

## Setting RECEPTION_PROXY_* values

The reception proxy connects the queue system to your clinic's registration software. **Do not commit these values to source code.**

### What they are

| Variable | Purpose |
|---|---|
| `RECEPTION_PROXY_BASE_URL` | The base URL where your reception software exposes a REST API (e.g. `https://proxy.your-clinic-software.com`) |
| `RECEPTION_PROXY_API_KEY` | The API key (bearer token / header key) issued by your reception software vendor |

### How to obtain them

1. Contact your reception software vendor or IT team and request:
   - The base URL of the registration proxy endpoint
   - An API key or access token for external integration

2. The system expects the proxy to expose a `GET /registrations` (or similar) endpoint that returns a list of patient registrations. See `apps/api/src/services/` for the expected response format.

### Where to enter them in Railway

1. Open your Railway project
2. Click on the **api** service
3. Click the **Variables** tab
4. Click **"New Variable"**
5. Enter `RECEPTION_PROXY_BASE_URL` → paste your URL → click **Add**
6. Repeat for `RECEPTION_PROXY_API_KEY` → paste your key → click **Add**
7. Railway will automatically redeploy the service with the new variables

> **Note:** You can run the full system **without** these values. In that case, the reception sync feature will be disabled, but all other queue management features (manual registration, room workflow, TV display, patient status) work normally.

---

## Triggering a new deploy

Railway auto-deploys whenever you push to the `main` branch of your GitHub repository.

To manually trigger a deploy:
1. Open your Railway project
2. Click the service (api or web)
3. Click **"Deployments"** tab
4. Click **"Redeploy"** (re-runs the latest deployment)

Or via Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (opens browser for GitHub OAuth)
railway login

# Link to your project
railway link

# Deploy from apps/api directory
cd apps/api
railway up

# Deploy from apps/web directory
cd ../web
railway up
```

---

## Verifying the deployment

After Railway shows both services as **Active**:

1. **API health check**
   ```
   GET https://<your-api-domain>.up.railway.app/health
   ```
   Expected response: `{ "status": "ok", ... }`

2. **API documentation**
   ```
   https://<your-api-domain>.up.railway.app/docs
   ```

3. **Web application**
   | View | Path |
   |---|---|
   | Home / Role Selector | `/` |
   | Floor Manager | `/floor` |
   | Room Technician | `/room` |
   | Patient Status | `/patient` |
   | TV Display | `/tv` |
   | Admin Panel | `/admin` |

4. **Add a test registration** to verify the queue pipeline:
   ```bash
   curl -X POST https://<your-api-domain>.up.railway.app/api/sync/webhook \
     -H "Content-Type: application/json" \
     -d '{"registrations":[{"id":"TEST-001","patientName":"Test Patient","patientAge":30,"patientGender":"Male","patientPhone":"9999999999","registrationNo":"NDC-TEST-001","tests":["USG-ABD","CBC"],"visitDate":"2026-03-18"}]}'
   ```

---

## Troubleshooting

### Build fails with "prisma: command not found"
Ensure your `apps/api/package.json` lists `prisma` in `devDependencies` (it does by default). Nixpacks installs all dependencies before running the build command.

### "Cannot find module 'dist/index.js'"
The TypeScript build (`npm run build`) must complete successfully. Check build logs in Railway Dashboard → api service → Deployments → click the failed deploy → **View Logs**.

### "Migration failed" or database errors
1. Confirm the `DATABASE_URL` variable is set and starts with `postgresql://`
2. Check that the Postgres plugin is running (green indicator in Railway project)
3. In Railway Dashboard → api service, check **Deployment Logs** for the exact Prisma error

### Web shows "Failed to load" or blank page
1. Verify `NEXT_PUBLIC_API_URL` points to the correct api domain (with `https://`)
2. Check that the api service is healthy (`/health` returns 200)
3. View web service logs: Railway Dashboard → web → Deployments → latest deploy → Logs

### Port issues
Railway automatically assigns and injects the `PORT` environment variable. The `node .next/standalone/server.js` command respects the Railway-injected `PORT`. The API listens on port 4000 internally; Railway handles external routing.

### Reception sync returns 0 results
1. Verify `RECEPTION_PROXY_BASE_URL` does not have a trailing slash
2. Verify `RECEPTION_PROXY_API_KEY` is correct
3. Test the proxy endpoint manually:
   ```bash
   curl -H "X-Api-Key: <your-key>" https://<proxy-url>/registrations
   ```
4. Contact your reception software vendor if the endpoint is unreachable
