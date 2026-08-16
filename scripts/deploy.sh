#!/bin/bash
set -e

DEPLOY_USER_LOCAL=$(whoami)
if [ "$DEPLOY_USER_LOCAL" = "root" ]; then
    APP_DIR="/root/sdics.tech"
else
    APP_DIR="/home/$DEPLOY_USER_LOCAL/sdics.tech"
fi
VENV_DIR="$APP_DIR/venv"
FRONTEND_DIST="/var/www/sdics/frontend"
MOBILE_DIST="/var/www/sdics/mobile"
USER_NAME=$DEPLOY_USER_LOCAL

echo "APP_DIR: $APP_DIR"
echo "VENV_DIR: $VENV_DIR"
echo "USER: $USER_NAME"

cd "$APP_DIR"

echo "=== Ensuring directories exist ==="
mkdir -p staticfiles media logs
sudo mkdir -p "$FRONTEND_DIST" "$MOBILE_DIST" 2>/dev/null || mkdir -p "$FRONTEND_DIST" "$MOBILE_DIST"
sudo chown -R $USER_NAME:$USER_NAME "$FRONTEND_DIST" "$MOBILE_DIST" 2>/dev/null || chown -R $USER_NAME:$USER_NAME "$FRONTEND_DIST" "$MOBILE_DIST"

if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found in $APP_DIR"
    echo "Create .env from .env.example or from GitHub secrets ENV_FILE."
    echo "IMPORTANT: DB_HOST and REDIS_HOST should be 'localhost', NOT 'db'/'redis' (Docker names)."
    exit 1
fi

echo "=== Setup Python virtual environment ==="
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Run Django migrations ==="
python manage.py migrate --noinput

echo "=== Collect static files ==="
python manage.py collectstatic --noinput

echo "=== Create admin user (if needed) ==="
python manage.py create_admin 2>/dev/null || echo "Admin user already exists or command skipped"

echo "=== Build main frontend ==="
cd frontend
npm ci
npm run build
rm -rf "$FRONTEND_DIST"/*
cp -a dist/. "$FRONTEND_DIST"/
cd ..

echo "=== Build mobile frontend ==="
cd frontend-mobile
npm ci --legacy-peer-deps
npm run build
rm -rf "$MOBILE_DIST"/*
cp -a dist/. "$MOBILE_DIST"/
cd ..

echo "=== Install nginx config ==="
sed "s|__APP_DIR__|$APP_DIR|g" nginx.conf > /tmp/sdics-nginx.conf
sudo cp -f /tmp/sdics-nginx.conf /etc/nginx/sites-available/sdics.tech.conf 2>/dev/null || cp -f /tmp/sdics-nginx.conf /etc/nginx/sites-available/sdics.tech.conf
sudo ln -sf /etc/nginx/sites-available/sdics.tech.conf /etc/nginx/sites-enabled/sdics.tech.conf 2>/dev/null || ln -sf /etc/nginx/sites-available/sdics.tech.conf /etc/nginx/sites-enabled/sdics.tech.conf
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || rm -f /etc/nginx/sites-enabled/default
rm -f /tmp/sdics-nginx.conf
sudo nginx -t 2>/dev/null || nginx -t

echo "=== Install systemd services ==="
export USER=$USER_NAME APP_DIR VENV_DIR
TMP_SERVICE=/tmp/sdics-services.tmp
for svc in sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat; do
    envsubst '$USER $APP_DIR $VENV_DIR' < scripts/systemd/$svc.service > $TMP_SERVICE
    sudo cp $TMP_SERVICE /etc/systemd/system/$svc.service 2>/dev/null || cp $TMP_SERVICE /etc/systemd/system/$svc.service
done
rm -f $TMP_SERVICE

echo "=== Restart services ==="
sudo systemctl daemon-reload 2>/dev/null || systemctl daemon-reload
sudo systemctl enable sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat 2>/dev/null || systemctl enable sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat 2>/dev/null || true
sudo systemctl restart sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat nginx 2>/dev/null || systemctl restart sdics-gunicorn sdics-daphne sdics-celery-worker sdics-celery-beat nginx 2>/dev/null || true

echo "=== Ensure PostgreSQL & Redis are running ==="
(sudo systemctl enable postgresql redis-server 2>/dev/null && sudo systemctl start postgresql redis-server 2>/dev/null) || \
(sudo systemctl enable postgresql redis 2>/dev/null && sudo systemctl start postgresql redis 2>/dev/null) || \
(systemctl enable postgresql redis-server 2>/dev/null && systemctl start postgresql redis-server 2>/dev/null) || \
true

echo ""
echo "✅ Local deploy script complete! Check status with:"
echo "   sudo systemctl status sdics-gunicorn sdics-daphne nginx"
echo "   journalctl -u sdics-gunicorn -n 50"
echo "   tail -f $APP_DIR/logs/*.log"
echo ""
echo "If you haven't already, run initial server setup first:"
echo "   sudo bash scripts/server-setup.sh"
