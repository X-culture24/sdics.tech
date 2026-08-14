# SDICS Deployment Guide for sdics.tech

## Quick Start

### 1. Initialize and Push to GitHub

```bash
# Navigate to project root
cd /path/to/sdics

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial SDICS deployment"

# Add new remote (replace with your repo)
git remote add origin https://github.com/X-culture24/sdics.tech.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 2. Server SSH Access

```bash
# SSH to server as root
ssh root@206.81.28.246

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
  python3 python3-pip python3-venv \
  nodejs npm \
  postgresql postgresql-contrib \
  nginx \
  redis-server \
  git \
  curl \
  certbot python3-certbot-nginx
```

### 3. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Inside psql:
CREATE USER sdics_user WITH PASSWORD 'your-db-password-change-this';
CREATE DATABASE sdics_db OWNER sdics_user;
ALTER ROLE sdics_user SET client_encoding TO 'utf8';
ALTER ROLE sdics_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sdics_user SET default_transaction_deferrable TO on;
ALTER ROLE sdics_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE sdics_db TO sdics_user;
\q
```

### 4. Manual Deployment (Before GitHub Actions)

```bash
# Create app directory
sudo mkdir -p /var/www/sdics.tech
sudo chown root:root /var/www/sdics.tech

# Clone repository
cd /var/www/sdics.tech
sudo git clone https://github.com/X-culture24/sdics.tech.git .

# Create virtual environment
sudo python3 -m venv /var/www/sdics.tech/venv
source /var/www/sdics.tech/venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file with your secrets
sudo nano .env

# Edit these values in .env:
# - DJANGO_SECRET_KEY
# - DB_PASSWORD
# - JWT_SECRET_KEY
# - JWT_REFRESH_SECRET_KEY
# - EMAIL credentials

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py create_admin

# Import citizen data
python manage.py import_citizens
```

### 5. Setup SSL Certificate

```bash
# Generate SSL certificate for sdics.tech
sudo certbot certonly --nginx -d sdics.tech -d www.sdics.tech

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 6. Start Services

```bash
# Start backend service
sudo systemctl start sdics-backend
sudo systemctl enable sdics-backend

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx
sudo systemctl enable nginx

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 7. Verify Deployment

```bash
# Check backend
curl -X OPTIONS http://127.0.0.1:8000/api/auth/login/

# Check frontend
curl https://sdics.tech/

# Check services status
sudo systemctl status sdics-backend
sudo systemctl status nginx
sudo systemctl status redis-server
sudo systemctl status postgresql
```

## GitHub Actions Workflow

The `.github/workflows/deploy.yml` file automates deployment on every push to main/develop branches.

### Add SSH Key to GitHub

1. Generate SSH key on server:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key -N ""
```

2. Add public key to GitHub:
   - Go to Settings → Deploy Keys
   - Add `~/.ssh/deploy_key.pub`

3. Add private key to GitHub:
   - Go to Settings → Secrets
   - Add `SERVER_SSH_KEY` with contents of `~/.ssh/deploy_key`

## Environment Variables (.env)

Create `.env` file at `/var/www/sdics.tech/.env` with:

```env
# Django
DEBUG=False
DJANGO_SECRET_KEY=your-very-secret-key-minimum-50-characters
ALLOWED_HOSTS=sdics.tech,www.sdics.tech,206.81.28.246

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=sdics_db
DB_USER=sdics_user
DB_PASSWORD=your-strong-db-password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_ALGORITHM=HS256
JWT_SECRET_KEY=your-jwt-secret-key-minimum-50-characters
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key-minimum-50-characters
JWT_EXPIRATION_DELTA=3600
JWT_REFRESH_EXPIRATION_DELTA=604800

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://sdics.tech,https://www.sdics.tech

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Application
DATASETS_DIR=datasets
IMPORT_BATCH_SIZE=5000
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## Troubleshooting

### Backend not starting
```bash
sudo systemctl status sdics-backend
sudo journalctl -u sdics-backend -n 50
```

### Check logs
```bash
tail -f /var/www/logs/backend-access.log
tail -f /var/www/logs/backend-error.log
```

### Restart services
```bash
sudo systemctl restart sdics-backend
sudo systemctl restart nginx
```

### Test API connection
```bash
curl -v https://sdics.tech/api/auth/login/
```

## Domain Configuration (DNS)

Point your domain registrar DNS records to:

```
A Record:    sdics.tech     → 206.81.28.246
CNAME Record: www.sdics.tech → sdics.tech
```

## Monitoring

### Check service status
```bash
sudo systemctl status sdics-backend nginx postgresql redis-server
```

### View application logs
```bash
journalctl -u sdics-backend -f
```

### Monitor server
```bash
htop
df -h
free -h
```

## Backup and Restore

### Backup database
```bash
sudo -u postgres pg_dump sdics_db > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
sudo -u postgres psql sdics_db < backup_20240814.sql
```

## Updates

### Pull latest changes
```bash
cd /var/www/sdics.tech
git pull origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart sdics-backend
```

## Next Steps

1. ✅ Initialize git repository
2. ✅ Push to GitHub
3. ✅ Add SSH key to GitHub secrets
4. ✅ SSH to server and run initial setup
5. ✅ Configure DNS records
6. ✅ Setup SSL certificates
7. ✅ Start services
8. ✅ Verify deployment
9. ✅ Monitor logs

## Support

- Backend logs: `/var/www/logs/backend-*.log`
- Nginx logs: `/var/log/nginx/sdics-*.log`
- System logs: `journalctl -u sdics-backend`
- Server: 206.81.28.246
- Domain: sdics.tech
