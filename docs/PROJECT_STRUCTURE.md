# SDICS Backend API - Project Structure

## Directory Organization

```
sdics-backend/
├── .env                          # Environment variables (local)
├── .env.example                  # Example environment variables
├── .gitignore                    # Git ignore rules
├── manage.py                     # Django management script
├── requirements.txt              # Python dependencies
│
├── docs/                         # Documentation
│   ├── PROJECT_STRUCTURE.md     # This file
│   ├── ARCHITECTURE.md          # System architecture
│   └── API.md                   # API documentation
│
├── sdics/                        # Django project settings
│   ├── __init__.py
│   ├── settings.py              # Project settings
│   ├── urls.py                  # Main URL routing
│   ├── wsgi.py                  # WSGI configuration
│   └── asgi.py                  # ASGI configuration (WebSocket)
│
├── core/                         # Main application
│   ├── __init__.py
│   ├── admin.py                 # Django admin configuration
│   ├── apps.py                  # App configuration
│   ├── models.py                # Database models
│   ├── serializers.py           # DRF serializers
│   ├── urls.py                  # API routes
│   ├── views.py                 # API views
│   ├── exceptions.py            # Custom exceptions
│   ├── utils.py                 # Utilities
│   ├── consumers.py             # WebSocket consumers
│   │
│   ├── middleware/              # Custom middleware
│   │   ├── __init__.py
│   │   ├── jwt_middleware.py    # JWT authentication
│   │   ├── rate_limiter.py      # Rate limiting
│   │   └── rbac.py              # Role-based access control
│   │
│   ├── services/                # Business logic services
│   │   ├── __init__.py
│   │   ├── auth_service.py      # Authentication service
│   │   ├── officer_service.py   # Officer management
│   │   ├── citizen_service.py   # Citizen search/registration
│   │   ├── campaign_service.py  # Campaign management
│   │   ├── dashboard_service.py # Dashboard metrics
│   │   └── validators.py        # Input validation
│   │
│   ├── tests/                   # Unit and integration tests
│   │   ├── __init__.py
│   │   ├── test_auth.py         # Authentication tests
│   │   ├── test_jwt_middleware.py
│   │   ├── test_rbac.py
│   │   ├── test_officers.py
│   │   ├── test_citizens.py
│   │   ├── test_campaigns.py
│   │   └── test_dashboard.py
│   │
│   ├── management/              # Django management commands
│   │   ├── commands/
│   │   │   └── import_citizens.py
│   │
│   └── migrations/              # Database migrations
│       └── *.py
│
├── datasets/                    # Data files
│   ├── BARINGO.csv
│   ├── BARINGO.xlsx
│   └── ... (county datasets)
│
├── logs/                        # Application logs
│   └── django.log
│
└── venv/                        # Virtual environment (git-ignored)
```

## Architecture Layers

### 1. Middleware Layer (`core/middleware/`)
- **jwt_middleware.py**: Extracts and verifies JWT tokens from requests
- **rate_limiter.py**: Enforces rate limiting on login attempts
- **rbac.py**: Role-based access control enforcement

### 2. Views Layer (`core/views.py`)
- REST API endpoints for all resources
- Authentication, officers, citizens, campaigns, dashboard, audit logs

### 3. Services Layer (`core/services/`)
- **auth_service.py**: PIN verification, token creation, authentication logic
- **officer_service.py**: Officer CRUD and management
- **citizen_service.py**: Citizen search, filtering, registration
- **campaign_service.py**: Campaign management and state transitions
- **dashboard_service.py**: Metrics aggregation and caching
- **validators.py**: Input validation and sanitization

### 4. Models Layer (`core/models.py`)
- Officer, Citizen, Campaign, Registration, AuditLog, RefreshToken, OfficerAssignedLocation

### 5. Exception Layer (`core/exceptions.py`)
- Custom exceptions with standardized error formatting
- SDICSException, ValidationError, AuthenticationError, etc.

## Key Features

- **JWT Authentication**: 15-min access tokens, 7-day refresh tokens
- **RBAC**: Three roles (REGISTRATION_OFFICER, SUPERVISOR, ADMINISTRATOR)
- **Rate Limiting**: 5 failed login attempts per 15 minutes per IP
- **Audit Logging**: Immutable audit trail of all actions
- **Real-time Dashboard**: WebSocket connections for live metrics
- **Database**: PostgreSQL with 1.8M citizen records
- **Caching**: Redis for dashboard metrics and citizen details

## Development Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Import citizen data
python manage.py import_citizens

# Run tests
python manage.py test

# Start development server
python manage.py runserver
```

## Testing

```bash
# Unit tests
python manage.py test core.tests

# Property-based tests with Hypothesis
pytest -v core/tests/

# Coverage
coverage run --source='core' manage.py test
coverage report
```
