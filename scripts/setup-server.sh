#!/bin/bash

# SDICS Server Setup Script
# Run as: sudo bash setup-server.sh

set -e

echo "=== SDICS Server Setup Started ==="
echo "Timestamp: $(date)"

# Update system
echo "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y

# Install dependencies
echo "Step 2: Installing required packages..."
apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  nodejs \
  npm \
  postgresql \
  postgresql-contrib \
  nginx \
  redis-server \
  git \
  curl \
  certbot \
  python3-certbot-nginx \
  build-essential \
  libpq-dev

# Create application user
echo "Step 3: Creating application user..."
useradd -m -s /bin/bash sdics || echo "User sdics already exists"

# Create directories
echo "Step 4: Creating directories..."
mkdir -p /var/www/sdics.tech
mkdir -p /var/www/logs
mkdir -p /var/www/data
chown -R root:root /var/www/sdics.tech

# Setup PostgreSQL database
echo "Step 5: Setting up PostgreSQL database..."
sudo -u postgres psql << SQL
CREATE USER IF NOT EXISTS sdics_user WITH PASSWORD 'your-db-password-change-this';
CREATE DATABASE IF NOT EXISTS sdics_db OWNER sdics_user;
ALTER ROLE sdics_user SET client_encoding TO 'utf8';
ALTER ROLE sdics_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sdics_user SET default_transaction_deferrable TO on;
ALTER ROLE sdics_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE sdics_db TO sdics_user;
SQL

echo "PostgreSQL configured"

# Clone repository
echo "Step 6: Cloning repository..."
cd /var/www/sdics.tech
git clone https://github.com/X-culture24/sdics.tech.git . || git pull origin main

# Create virtual environment
echo "Step 7: Creating Python virtual environment..."
python3 -m venv /var/www/sdics.tech/venv
source /var/www/sdics.tech/venv/bin/activate

# Install Python dependencies
echo "Step 8: Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file template
echo "Step 9: Creating .env file..."
cat > /var/www/sdics.tech/.env << 'EOF'
DEBUG=False
DJANGO_SECRET_KEY=your-secret-key-change-this-to-a-long-random-string
ALLOWED_HOSTS=sdics.tech,www.sdics.tech,206.81.28.246

DB_ENGINE=django.db.backends.postgresql
DB_NAME=sdics_db
DB_USER=sdics_user
DB_PASSWORD=your-db-password-change-this
DB_HOST=localhost
DB_PORT=5432

JWT_ALGORITHM=HS256
JWT_SECRET_KEY=your-jwt-secret-key-change-this
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key-change-this
JWT_EXPIRATION_DELTA=3600
JWT_REFRESH_EXPIRATION_DELTA=604800

REDIS_HOST=localhost
REDIS_PORT=6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

CORS_ALLOWED_ORIGINS=https://sdics.tech,https://www.sdics.tech

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

DATASETS_DIR=datasets
IMPORT_BATCH_SIZE=5000
ENVIRONMENT=production
EOF

echo "⚠️  EDIT .env FILE WITH YOUR SECRETS:"
echo "   nano /var/www/sdics.tech/.env"

# Setup systemd service
echo "Step 10: Setting up systemd service..."
cat > /etc/systemd/system/sdics-backend.service << 'EOF'
[Unit]
Description=SDICS Backend Service
After=network.target postgresql.service redis-server.service

[Service]
Type=notify
User=root
WorkingDirectory=/var/www/sdics.tech
Environment="PATH=/var/www/sdics.tech/venv/bin"
ExecStart=/var/www/sdics.tech/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 4 --worker-class sync --timeout 120 --access-logfile /var/www/logs/backend-access.log --error-logfile /var/www/logs/backend-error.log sdics.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sdics-backend.service

# Configure Nginx
echo "Step 11: Configuring Nginx..."
cat > /etc/nginx/sites-available/sdics.tech << 'EOF'
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name sdics.tech www.sdics.tech 206.81.28.246;
    client_max_body_size 100M;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sdics.tech www.sdics.tech 206.81.28.246;
    client_max_body_size 100M;

    ssl_certificate /etc/letsencrypt/live/sdics.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sdics.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/sdics-access.log;
    error_log /var/log/nginx/sdics-error.log;

    location / {
        root /var/www/sdics.tech/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /static/ {
        alias /var/www/sdics.tech/staticfiles/;
    }

    location /media/ {
        alias /var/www/sdics.tech/media/;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

ln -sf /etc/nginx/sites-available/sdics.tech /etc/nginx/sites-enabled/sdics.tech
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Enable services
echo "Step 12: Enabling services..."
systemctl enable postgresql
systemctl enable redis-server
systemctl enable nginx
systemctl enable sdics-backend.service

echo ""
echo "=== Server Setup Complete ==="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Edit .env file with your secrets:"
echo "   nano /var/www/sdics.tech/.env"
echo ""
echo "2. Run database migrations:"
echo "   cd /var/www/sdics.tech && source venv/bin/activate"
echo "   python manage.py migrate"
echo ""
echo "3. Create superuser:"
echo "   python manage.py create_admin"
echo ""
echo "4. Import citizen data:"
echo "   python manage.py import_citizens"
echo ""
echo "5. Collect static files:"
echo "   python manage.py collectstatic --noinput"
echo ""
echo "6. Setup SSL certificate:"
echo "   certbot certonly --nginx -d sdics.tech -d www.sdics.tech"
echo ""
echo "7. Start services:"
echo "   systemctl start sdics-backend"
echo "   systemctl restart nginx"
echo ""
echo "8. Verify deployment:"
echo "   curl https://sdics.tech/"
echo ""
