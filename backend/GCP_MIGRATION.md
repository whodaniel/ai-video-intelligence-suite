# AI Video Intel — CloudRuntime to GCP Cloud Run Migration

## Overview

Migrating the AI Video Intel backend from CloudRuntime (currently down/502) to GCP Cloud Run, matching the pattern established in the main TNF migration.

**GCP Project:** `the-new-fuse-2025`
**Region:** `us-central1`
**Artifact Registry:** `us-central1-docker.pkg.dev/the-new-fuse-2025/tnf-services/`
**Service Name:** `aivi-backend`

## Files Created

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Node 22 Alpine build for Cloud Run (port 8080) |
| `backend/.dockerignore` | Excludes node_modules, .env, etc. from Docker context |
| `backend/.gcloudignore` | Excludes files from Cloud Build context |
| `backend/cloudbuild.yaml` | Cloud Build pipeline: build → push → deploy to Cloud Run |
| `backend/scripts/gcp-deploy.sh` | Manual deploy script |

## Files Modified

| File | Change |
|------|--------|
| `backend/server.js` | Default port 3000 → 8080 (Cloud Run); health check reports DB status |
| `backend/config/database.js` | Graceful DB failure instead of `process.exit(-1)` |
| `services/api-client.js` | Added 502/503/504 retry with exponential backoff; backend-down detection |

## Prerequisites

### 1. GCP Setup

```bash
# Authenticate with GCP
gcloud auth login
gcloud config set project the-new-fuse-2025

# Ensure Artifact Registry repo exists
gcloud artifacts repositories create tnf-services \
  --repository-format=docker \
  --location=us-central1 \
  --project=the-new-fuse-2025
```

### 2. Set Secret Environment Variables in Cloud Run

The `cloudbuild.yaml` only sets `NODE_ENV` and `PORT`. **You must set secrets separately:**

```bash
# Set env vars on the Cloud Run service (secrets should use Secret Manager in production)
gcloud run services update aivi-backend \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=<your-supabase-connection-string>" \
  --set-env-vars="JWT_SECRET=<your-jwt-secret>" \
  --set-env-vars="JWT_EXPIRES_IN=7d" \
  --set-env-vars="GOOGLE_CLIENT_ID=998509408180-8ucfo5f3chd77p0qm7j5c2rqgpuqkpgo.apps.googleusercontent.com" \
  --set-env-vars="GOOGLE_CLIENT_SECRET=<your-google-client-secret>" \
  --set-env-vars="STRIPE_SECRET_KEY=<your-stripe-key>" \
  --set-env-vars="FRONTEND_URL=chrome-extension://*" \
  --set-env-vars="WEB_DASHBOARD_URL=https://aivideointel.thenewfuse.com"
```

**Recommended:** Use Secret Manager for sensitive values:

```bash
# Create secrets
echo -n "<your-database-url>" | gcloud secrets create AIVI_DATABASE_URL --data-file=-
echo -n "<your-jwt-secret>" | gcloud secrets create AIVI_JWT_SECRET --data-file=-

# Reference secrets in Cloud Run
gcloud run services update aivi-backend \
  --region=us-central1 \
  --update-secrets="DATABASE_URL=AIVI_DATABASE_URL:latest" \
  --update-secrets="JWT_SECRET=AIVI_JWT_SECRET:latest"
```

### 3. DNS Configuration

After the first successful deploy, fetch the Cloud Run URL host and use that as
the DNS target in Cloudflare:

```bash
SERVICE_URL=$(gcloud run services describe aivi-backend \
  --region=us-central1 \
  --project=the-new-fuse-2025 \
  --format='value(status.url)')
echo "$SERVICE_URL"
echo "${SERVICE_URL#https://}"
```

| Record | Type | Value |
|--------|------|-------|
| `aivideointel` | CNAME | `<host from status.url>` |

Example target:
`aivi-backend-XXXXX.us-central1.run.app`

## Deploy

### Option A: Manual deploy script

```bash
cd /path/to/ai-video-intelligence-suite/backend
./scripts/gcp-deploy.sh
```

Optional: include Cloudflare DNS auto-update in the same run:

```bash
cd /path/to/ai-video-intelligence-suite/backend
CLOUDFLARE_API_TOKEN=<token> \
CLOUDFLARE_ZONE_ID=<zone-id> \
./scripts/gcp-deploy.sh
```

### Option B: Direct gcloud command

```bash
cd /path/to/ai-video-intelligence-suite/backend
gcloud builds submit --config cloudbuild.yaml . --project=the-new-fuse-2025
```

### Option C: Quick deploy without Cloud Build

```bash
cd /path/to/ai-video-intelligence-suite/backend

# Build and push
gcloud builds submit --tag us-central1-docker.pkg.dev/the-new-fuse-2025/tnf-services/aivi-backend:latest

# Deploy
gcloud run deploy aivi-backend \
  --image us-central1-docker.pkg.dev/the-new-fuse-2025/tnf-services/aivi-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --project the-new-fuse-2025
```

## Verify

```bash
# Check service status
gcloud run services describe aivi-backend --region=us-central1

# Fetch service URL and hit health endpoint
SERVICE_URL=$(gcloud run services describe aivi-backend --region=us-central1 --project=the-new-fuse-2025 --format='value(status.url)')
curl "${SERVICE_URL}/health"

# After DNS update:
curl https://aivideointel.thenewfuse.com/health
```

## What Changed (Server-side)

### Port: 3000 → 8080
Cloud Run expects services to listen on port 8080 by default. The `PORT` env var is respected.

### Graceful DB Failure
Previously, if `DATABASE_URL` was invalid or the DB was unreachable, the `pool.on('error')` handler called `process.exit(-1)`, causing CloudRuntime to restart the service in a crash loop (hitting `restartPolicyMaxRetries: 10` and giving up → 502).

Now:
- The server starts even without a valid DB connection
- The `/health` endpoint returns `503` with `status: "degraded"` and `database: "unavailable"`
- API routes that require DB return `503 Service Unavailable` instead of crashing
- When DB comes back online, `dbAvailable` is set back to `true`

### Health Check
The `/health` endpoint now reports DB connectivity status, which Cloud Run uses for health checks (configured via `cloud_runtime.json` → now handled by Cloud Run's built-in health checking).

## Client-side Changes

### api-client.js
- Added retry with exponential backoff for 502/503/504 (up to 3 retries)
- Added `isBackendDown` flag with 30s cooldown to avoid hammering a downed backend
- Network errors (TypeError from failed fetch) also trigger retries
- User-friendly error message: "Backend is temporarily unavailable"
- 401 auth refresh flow preserved as before

## Post-Migration Checklist

- [ ] Deploy to Cloud Run
- [ ] Set all env vars / secrets
- [ ] Verify `/health` returns 200
- [ ] Verify `/api` returns API info
- [ ] Test Chrome extension auth flow
- [ ] Test reports endpoint
- [ ] Update DNS CNAME for `aivideointel.thenewfuse.com`
- [ ] Wait for DNS propagation
- [ ] Decommission CloudRuntime service
- [ ] Update `backend/.env` to reflect production URLs
