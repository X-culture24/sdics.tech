#!/bin/bash
set -e

echo "=========================================="
echo " SDICS Server Initial Setup (Ubuntu 22.04/24.04)"
echo " Run as root or with sudo!"
echo "=========================================="

if [ "$(id -u)" -ne 0 ]; then
    echo "Please run as root: sudo bash $0"
    exit 1
fi

read -p "Deploy username (will be created if missing): " DEPLOY_USER
if [ -z "$DEPLOY_USER" ]; then echo "Username required"; exit 1; fi

DEPLOY_HOME="/home/$DEPLOY_USER"
APP_DIR="$DEPLOY_HOME/sdics.tech"

echo ""
echo "[1/7] Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo ""
echo "[2/7] Installing system dependencies: PostgreSQL, Redis, Nginx, Python, Node.js, build tools..."
apt-get install -y \
    curl wget git gnupg2 lsb-release ca-certificates apt-transport-https \
    build-essential libpq-dev libssl-dev libffi-dev zlib1g-dev \
    python3 python3-venv python3-pip python3-dev \
    postgresql postgresql-contrib \
    redis-server \
    nginx \
    gettext-base \
    htop vim tmux net-tools

echo ""
echo "[3/7] Enabling and starting PostgreSQL & Redis..."
systemctl enable --now postgresql
systemctl enable --now redis-server
pg_isready || (echo "PostgreSQL not ready yet, waiting..."; sleep 3; pg_isready)
redis-cli ping || true

echo ""
echo "[4/7] Setting up deploy user: $DEPLOY_USER..."
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    echo "User $DEPLOY_USER created."
else
    echo "User $DEPLOY_USER already exists."
fi

mkdir -p "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"

echo ""
echo "[5/7] Creating PostgreSQL database & user..."
DB_NAME=$(grep -E "^DB_NAME=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "sdics")
DB_USER=$(grep -E "^DB_USER=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "sdics")
DB_PASS=$(grep -E "^DB_PASSWORD=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "")

sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;"

if [ -n "$DB_PASS" ]; then
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
fi

sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo "PostgreSQL DB '$DB_NAME' with owner '$DB_USER' ready."

echo ""
echo "[6/7] Installing Node.js 20.x (for frontend builds)..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 18 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
node -v
npm -v

echo ""
echo "[7/7] Preparing directories and Nginx..."
mkdir -p /var/www/sdics/frontend /var/www/sdics/mobile
chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/www/sdics
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
rm -f /etc/nginx/sites-enabled/default

systemctl enable nginx

echo ""
echo "=========================================="
echo " ✅ Initial server setup complete."
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. As $DEPLOY_USER, clone the repo into $APP_DIR:"
echo "       cd $APP_DIR && git clone https://github.com/<your-repo>.git ."
echo ""
echo "  2. Create $APP_DIR/.env from .env.example or from GitHub secrets ENV_FILE"
echo "     (DB_HOST=localhost, REDIS_HOST=localhost)"
echo ""
echo "  3. Run deployment script as $DEPLOY_USER:"
echo "       cd $APP_DIR && bash scripts/deploy.sh"
echo ""
echo "  4. Or trigger the GitHub Actions deploy.yml workflow."
echo ""
echo "Useful commands:"
echo "  systemctl status sdics-gunicorn sdics-daphne nginx postgresql redis-server"
echo "  journalctl -u sdics-gunicorn -f"
echo "  tail -f $APP_DIR/logs/*.log"
