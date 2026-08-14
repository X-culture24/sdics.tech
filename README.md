# SDICS - Citizen Registration and Monitoring System

A production-ready Django + PostgreSQL + React system for registering ~1.8 million unregistered citizens across 10 Kenyan counties.

## Quick Deployment to sdics.tech

### Domain: https://sdics.tech
### Server: 206.81.28.246

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

#### Quick Deploy Steps:
1. Push code: `git push origin main`
2. GitHub Actions will automatically deploy to 206.81.28.246
3. SSH to server and update `.env` with secrets
4. Setup SSL: `certbot certonly --nginx -d sdics.tech`
5. Restart: `systemctl restart sdics-backend nginx`

## Architecture

**Backend**: Django REST Framework with PostgreSQL  
**Frontend**: React TypeScript with Material UI (separate repository)  
**Real-time**: Django Channels + WebSocket + Redis  
**Async**: Celery for background tasks  
**Import**: Streaming Excel parser with batch processing  

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 12+
- Redis 6+
- pip

### Installation

1. Clone and set up environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create database:
```bash
createdb sdics
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```

6. Load sample data (optional):
```bash
# Place Excel files in datasets/ folder
python manage.py import_citizens
```

7. Start development server:
```bash
python manage.py runserver
```

8. Start Celery worker (in separate terminal):
```bash
celery -A sdics worker -l info
```

9. Access admin at http://localhost:8000/admin/

## Project Structure

```
sdics/
├── sdics/              # Project configuration
│   ├── settings.py     # Django settings
│   ├── urls.py         # URL routing
│   ├── asgi.py         # WebSocket config
│   └── wsgi.py         # WSGI config
├── core/               # Main app
│   ├── models.py       # Database models
│   ├── serializers.py  # DRF serializers
│   ├── views.py        # API endpoints
│   ├── urls.py         # App URLs
│   ├── admin.py        # Django admin
│   ├── utils.py        # Helper functions
│   ├── consumers.py    # WebSocket consumers
│   ├── management/     # Management commands
│   │   └── commands/
│   │       └── import_citizens.py  # Excel import
│   └── tests.py        # Unit tests
├── datasets/           # Excel files for import
├── manage.py           # Django CLI
├── requirements.txt    # Python dependencies
└── .env.example        # Environment template
```

## Data Model

### Core Tables

**Citizen**: Unregistered citizen from Excel (national_id, full_name, sex, date_of_birth, tribe, phone_number, county, district, division, location, sub_location, village, registration_status)

**Officer**: Registration professional (national_id, full_name, phone, role, status, pin_hash, last_login)

**Campaign**: Registration campaign with targets (name, start_date, end_date, target_count, status)

**Registration**: Records each registration event (citizen_id, officer_id, campaign_id, registered_at, device_info, ip_address)

**AuditLog**: Immutable audit trail (user, action, entity_type, entity_id, ip_address, user_agent, metadata)

**ImportLog**: Excel import tracking (file_path, county, processed_count, duplicate_count, failed_count, errors, status)

## Excel Import

### File Format

Excel files should be in the `datasets/` folder with sheet name "Gaps".

**Required columns**:
- Full Name
- Sex
- District
- Division
- Location
- Sub Location (optional)
- Village (optional)
- ID Number
- Date of Birth (optional)
- Tribe (optional)
- Phone Numbers (optional)

### Running Import

```bash
# Import all files in datasets/ folder
python manage.py import_citizens

# Import specific file
python manage.py import_citizens --file datasets/Nairobi/Gaps.xlsx --county Nairobi

# Dry run (no database changes)
python manage.py import_citizens --dry-run

# Custom batch size
python manage.py import_citizens --batch-size 10000
```

### Import Process

1. **Streaming**: Reads Excel row-by-row without loading entire file into memory
2. **Column Detection**: Fuzzy matches Excel columns to database fields
3. **Normalization**: Trims whitespace, standardizes case, validates formats
4. **Batch Processing**: Accumulates rows into configurable batches (default 5000)
5. **Duplicate Detection**: Skips national_ids already in database
6. **Error Resilience**: Continues on error, logs details for review
7. **Atomic Transactions**: Each batch inserted within transaction
8. **Audit Trail**: ImportLog records statistics and errors

### Example: Import 1.8M Records

```bash
# Create datasets folder with county subdirectories
mkdir -p datasets/{Nairobi,Mombasa,Kisumu}

# Place Excel files
cp Nairobi_citizens.xlsx datasets/Nairobi/Gaps.xlsx
cp Mombasa_citizens.xlsx datasets/Mombasa/Gaps.xlsx
cp Kisumu_citizens.xlsx datasets/Kisumu/Gaps.xlsx

# Run import with custom batch size (larger = faster but more memory)
python manage.py import_citizens --batch-size 10000

# Check import logs
python manage.py shell
>>> from core.models import ImportLog
>>> ImportLog.objects.all()
```

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/login/` - Login with national_id + PIN
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout (invalidate token)
- `POST /api/auth/change-pin/` - Change officer PIN

### Citizens
- `GET /api/citizens/search/?q=query&page=1` - Search citizens
- `GET /api/citizens/filter/?county=...&district=...` - Filter citizens
- `GET /api/citizens/{national_id}/` - Get citizen details
- `POST /api/citizens/{national_id}/register/` - Register citizen

### Officers (Admin)
- `GET /api/officers/` - List officers
- `POST /api/officers/` - Create officer
- `PATCH /api/officers/{id}/` - Update officer
- `POST /api/officers/{id}/reset-pin/` - Reset officer PIN
- `POST /api/officers/{id}/deactivate/` - Deactivate officer

### Dashboard
- `GET /api/dashboard/summary/` - Summary metrics
- `GET /api/dashboard/by-county/` - Metrics by county
- `GET /api/dashboard/by-district/` - Metrics by district
- `GET /api/dashboard/by-officer/` - Metrics by officer

### WebSocket
- `ws://localhost:8000/ws/dashboard/?token=JWT_TOKEN` - Real-time dashboard updates

## Testing

```bash
# Run all tests
python manage.py test

# Run specific test class
python manage.py test core.tests.OfficerModelTests

# Run with verbose output
python manage.py test --verbosity=2
```

## Database Performance

### Indexes
All critical fields are indexed:
- Citizen: national_id (UNIQUE), registration_status, county, district, location, created_at, full_name
- Officer: national_id (UNIQUE), status, role
- Registration: citizen_id, officer_id, campaign_id, created_at
- AuditLog: user, action, entity_type, created_at

### Query Optimization
- Use `select_related()` for foreign keys
- Use `prefetch_related()` for reverse relations
- Pagination mandatory (default 25 records per page)
- Server-side search/filter (no client-side processing of 1.8M records)

## Production Deployment

### Environment Variables
```bash
DEBUG=False
DJANGO_SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your.domain.com,www.your.domain.com

# Database
DB_NAME=sdics_prod
DB_USER=postgres
DB_PASSWORD=strong-password
DB_HOST=prod-db.internal
DB_PORT=5432

# Redis
REDIS_HOST=prod-redis.internal
REDIS_PORT=6379

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-password
```

### Deployment to sdics.tech (206.81.28.246)

**Automatic Deployment** via GitHub Actions:
1. All pushes to `main` or `develop` branches trigger `.github/workflows/deploy.yml`
2. Workflow clones repo, builds frontend, and deploys to server
3. Services auto-restart and health checks verify deployment

**Manual Setup**:
```bash
# SSH to server
ssh root@206.81.28.246

# Run setup script
bash /var/www/sdics.tech/scripts/setup-server.sh

# Edit environment variables
nano /var/www/sdics.tech/.env

# Initialize database
cd /var/www/sdics.tech
source venv/bin/activate
python manage.py migrate
python manage.py create_admin
python manage.py import_citizens

# Setup SSL
certbot certonly --nginx -d sdics.tech -d www.sdics.tech

# Start services
systemctl start sdics-backend
systemctl restart nginx
```

**Service Management**:
```bash
# Start/stop backend
sudo systemctl start sdics-backend
sudo systemctl stop sdics-backend
sudo systemctl restart sdics-backend

# View logs
sudo journalctl -u sdics-backend -f

# Status
sudo systemctl status sdics-backend nginx redis-server postgresql
```

### Deployment Checklist
- [ ] Set `DEBUG=False`
- [ ] Use strong `DJANGO_SECRET_KEY`
- [ ] Configure PostgreSQL with connection pooling
- [ ] Set up Redis for Celery and caching
- [ ] Configure HTTPS/TLS via Nginx
- [ ] Set up daily database backups
- [ ] Configure Celery to run as service
- [ ] Set up log aggregation (syslog/ELK)
- [ ] Configure rate limiting
- [ ] Test import with 100k+ records
- [ ] Add SSH deploy key to GitHub
- [ ] Configure DNS records to 206.81.28.246

## Monitoring

### Logs
```bash
tail -f logs/django.log
```

### Import Progress
```python
from core.models import ImportLog
ImportLog.objects.filter(status='PROCESSING').values()
```

### Database Size
```sql
SELECT pg_size_pretty(pg_total_relation_size('core_citizen'));
```

## Support

For issues or questions, contact the development team.

---

**Schema Version**: 1.0  
**Last Updated**: 2024-08-12  
**Handles**: ~1.8 million unregistered citizens  
**Architecture**: Excel → PostgreSQL → API → React (server-side only)
