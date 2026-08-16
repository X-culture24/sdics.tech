# SDICS - Citizen Registration and Monitoring System

A production-ready Django + PostgreSQL + React system for registering ~1.8 million unregistered citizens across 10 Kenyan counties.

## Production Deployment (Native — No Docker)

All services run natively on the server via systemd, with git-deployed code, nginx as reverse proxy, and locally-installed PostgreSQL/Redis. **No Docker or containers are used** — everything runs directly on the host OS.

**Server**: 206.81.28.246  
**Domain**: https://sdics.tech

## Quick Start (Automatic Deployment via GitHub Actions)

1. Set GitHub secrets (match the secret names exactly!)
2. Push to `main` or `production` branch
3. GitHub Actions (`deploy.yml`) automatically deploys to the server
4. Check deployment status by SSHing into the server and running the status commands below

### GitHub Secrets Required (Repository → Settings → Secrets and variables → Actions)

| Secret Name | Required? | Description |
|-------------|-----------|-------------|
| **`SERVER_SSH_KEY`** | ✅ YES | Private SSH key for the deploy user (e.g. root) on 206.81.28.246 |
| **`ENV_FILE`** | ✅ YES | **Entire contents** of the `.env` file (use the ready-to-copy template below) |
| `DEPLOY_HOST` | ⚙️ Optional | Override server IP (default: `206.81.28.246`) |
| `DEPLOY_USER` | ⚙️ Optional | Override SSH username (default: `root`) |

### 📋 ENV_FILE Template — Copy & Paste Into Your GitHub Secret

This is the **exact content** to put inside the `ENV_FILE` GitHub secret. DB_HOST/REDIS_HOST are already set to `localhost` (NOT Docker hostnames):

```
DEBUG=False
DJANGO_SECRET_KEY=django-insecure-sdics-prod-key-change-in-production-12345678901234567890
ALLOWED_HOSTS=sdics.tech,www.sdics.tech,206.81.28.246,localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=sdics_db
DB_USER=james
DB_PASSWORD=James_Bond007!
DB_HOST=localhost
DB_PORT=5432
DB_CONN_MAX_AGE=600
USE_CONNECTION_POOL=False

REDIS_HOST=localhost
REDIS_PORT=6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

CORS_ALLOWED_ORIGINS=https://sdics.tech,https://www.sdics.tech,http://localhost:3000,http://127.0.0.1:3000

DATASETS_DIR=./datasets
IMPORT_BATCH_SIZE=5000

SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

> 🔐 **Security tip after first deploy**: Replace `DJANGO_SECRET_KEY` with the output of `openssl rand -base64 64` and update `DB_PASSWORD` to a strong unique value (re-save the GitHub secret).

## What the Deploy Pipeline Actually Does

Inside `.github/workflows/deploy.yml` — on every push to `main`/`production`:

1. SSHes into `DEPLOY_USER@DEPLOY_HOST` using `SERVER_SSH_KEY`
2. Pulls the latest git code (or clones the repo fresh on first deploy) into `~/sdics.tech`
3. Writes the full `.env` file from the `ENV_FILE` GitHub secret
4. Creates/updates a Python `venv` → `pip install -r requirements.txt`
5. Runs Django `migrate` → `collectstatic` → `create_admin`
6. Builds **frontend** (`npm ci && npm run build`) → serves from `/var/www/sdics/frontend`
7. Builds **frontend-mobile** → serves from `/var/www/sdics/mobile`
8. Installs the nginx vhost at `/etc/nginx/sites-available/sdics.tech.conf`
9. Installs & restarts 4 systemd services (gunicorn/daphne/celery-worker/celery-beat)
10. Restarts nginx, ensures PostgreSQL + Redis are running, and performs health checks

## Services, Ports & File Layout

| Component | Where it runs / listens | How it's managed |
|-----------|-------------------------|------------------|
| Django WSGI (HTTP API) | `127.0.0.1:8000` | systemd: `sdics-gunicorn.service` |
| Django ASGI (WebSocket `/ws/`) | `127.0.0.1:8001` | systemd: `sdics-daphne.service` |
| Celery async tasks (worker) | - | systemd: `sdics-celery-worker.service` |
| Celery periodic tasks (beat) | - | systemd: `sdics-celery-beat.service` |
| Nginx reverse proxy | `:80` (public) | systemd: `nginx` → vhost `sdics.tech.conf` |
| PostgreSQL | `127.0.0.1:5432` | systemd: `postgresql` → DB on disk |
| Redis | `127.0.0.1:6379` | systemd: `redis-server` → data on disk |

**Paths on server (as `root` deploy user):**
- App source: `/root/sdics.tech/` (or `/home/<deployuser>/sdics.tech/` for non-root user)
- Python env: `<APP_DIR>/venv/`
- Static files alias: `<APP_DIR>/staticfiles/`, media: `<APP_DIR>/media/`
- Logs: `<APP_DIR>/logs/gunicorn-*.log`, `<APP_DIR>/logs/django.log`, `journalctl -u sdics-gunicorn`
- Frontend dist (browser): `/var/www/sdics/frontend/` → served at `/`
- Mobile dist (browser): `/var/www/sdics/mobile/` → served at `/mobile/`

## Useful Server Commands (SSH in first!)

```bash
# See all SDICS services status
sudo systemctl status sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat nginx postgresql redis-server

# Tail service logs in real-time
sudo journalctl -u sdics-gunicorn -f
sudo journalctl -u sdics-daphne -f --since "10 minutes ago"
sudo journalctl -u nginx -f

# Application logs
tail -f ~/sdics.tech/logs/django.log
tail -f ~/sdics.tech/logs/gunicorn-error.log

# Manually re-run a deploy on the server itself (bypasses GitHub Actions)
cd ~/sdics.tech
bash scripts/deploy.sh

# Restart just the backend (e.g. after quick .env tweak)
sudo systemctl restart sdics-gunicorn sdics-daphne

# Restart everything
sudo systemctl restart sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat nginx
```

## First-Time Server Setup (Run Once On A Fresh Ubuntu 22.04 / 24.04 Box)

Only needed for brand new servers, **not needed on 206.81.28.246 if already provisioned**:

```bash
# As root on the server
bash scripts/server-setup.sh
# → prompts for deploy username
# → installs: postgresql, redis-server, nginx, python3-venv, node 20, build-essential
# → creates PostgreSQL DB + user (reads credentials from an existing .env if present)
```

After provisioning, copy the repo in + put `.env` in place + run `scripts/deploy.sh`, or just trigger the GitHub Actions pipeline.

## Architecture

**Backend**: Django 4.2 REST Framework with PostgreSQL + Redis + Django Channels  
**Frontend**: React 18 TypeScript with Vite + Material UI + React Query + React Leaflet map  
**Officer Mobile PWA**: React 18 + Capacitor (optional Android APK build via `scripts/build-mobile-apk.sh`)  
**Real-time**: Django Channels + Daphne + WebSocket over Redis pub/sub  
**Async**: Celery worker + Celery beat broker/results over Redis  
**SMS PINs**: Twilio integration  
**Deployment pipeline**: GitHub Actions `deploy.yml` → SSH → git pull → venv/npm builds → systemd + nginx (no Docker)

## Local Development Quick Start

### Prerequisites
- Python 3.12+
- PostgreSQL 12+ running locally on port 5432
- Redis 6+ running locally on port 6379
- Node.js 18/20 + npm

### Backend
```bash
cp .env.example .env   # edit DB_USER / DB_PASSWORD / DB_NAME to local values
pip install -r requirements.txt
createdb sdics          # if it doesn't exist yet
python manage.py migrate
python manage.py create_admin   # or: python manage.py createsuperuser
python manage.py runserver      # Django dev server on http://localhost:8000
```

### Celery (optional, for async tasks)
```bash
celery -A sdics worker -l info
celery -A sdics beat -l info
```

### Frontend (Main Dashboard)
```bash
cd frontend
npm ci
npm run dev    # http://localhost:3000 (proxies /api to django dev server)
```

### Officer Mobile App
```bash
cd frontend-mobile
npm ci
npm run dev    # Mobile PWA preview
```

## Project Structure

```
sdics.tech/
├── sdics/              # Project configuration (settings, urls, asgi, wsgi)
├── core/               # Main Django app (models, views, serializers, middleware, consumers, commands/services)
├── frontend/           # Main dashboard React SPA → nginx-served at /
│   └── nginx.conf      # (kept as reference; root nginx.conf handles both frontends)
├── frontend-mobile/    # Officer mobile React PWA → nginx-served at /mobile/
├── nginx.conf          # Production nginx vhost template (uses __APP_DIR__ placeholder)
├── requirements.txt    # Python backend dependencies
├── manage.py           # Django CLI
├── .env.example        # Copy/source for local dev, or use as reference for ENV_FILE secret
├── .env                # Local env file only (gitignored — never commit, use ENV_FILE secret!)
├── scripts/
│   ├── deploy.sh                   # Manual on-server deploy (same 14 steps as the CI pipeline)
│   ├── server-setup.sh             # One-shot new server provisioning (apt installs + pg DB + user)
│   ├── build-mobile-apk.sh         # Android Capacitor APK build
│   └── systemd/                    # Parametrized systemd unit templates for the 4 SDICS services
│       ├── sdics-gunicorn.service       # Django WSGI / HTTP (→ nginx /api/ proxy)
│       ├── sdics-daphne.service         # Django ASGI / WebSocket (→ nginx /ws/ proxy)
│       ├── sdics-celery-worker.service  # Async task workers
│       └── sdics-celery-beat.service    # Periodic/beat scheduler
└── .github/workflows/
    └── deploy.yml          # GitHub Actions CI/CD pipeline (push to main/prod → SSH git deploy → systemd restart)
```
