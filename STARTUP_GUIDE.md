# SDICS Startup Guide

## Quick Start

### 1. Backend Setup (Django)

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations (if needed)
python manage.py migrate

# Start backend on 0.0.0.0:8000 (allows external connections)
python manage.py runserver 0.0.0.0:8000
```

**Important:** Must use `0.0.0.0:8000` so mobile frontend on port 5175 can reach it.

### 2. Desktop Frontend (React)

Open a new terminal:

```bash
cd frontend
npm run dev
```

Access at: `http://localhost:5173`

### 3. Mobile Frontend (React Native)

Open another terminal:

```bash
cd frontend-mobile
npm run dev
```

Access at: `http://localhost:5175`

---

## Configuration

### Backend (.env)

```
DB_USER=james
DB_PASSWORD=James_Bond007!
DB_NAME=sdics_db
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175
```

### Desktop Frontend (frontend/.env)

```
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

### Mobile Frontend (frontend-mobile/.env)

```
VITE_API_URL=http://localhost:8000/api
```

---

## Test Credentials

- **National ID:** `12345678`
- **PIN:** `12345678`
- **Admin Email:** `admin@sdics.tech`
- **Admin Password:** `Admin@123456`

---

## Architecture

### Desktop Dashboard (frontend - port 5173)
- Professional analytics dashboard
- Tab-based navigation (Dashboard, Officers, Locations, Reports, Data, Verify, Exports)
- Detailed charts and tables
- Full feature set for administrators

### Mobile App (frontend-mobile - port 5175)
- Mobile-optimized interface
- Bottom tab navigation
- Simplified, touch-friendly design
- Responsive for all screen sizes

### Backend API (Django - port 8000)
- RESTful API with JWT authentication
- Dashboard endpoints return aggregated metrics
- CORS enabled for frontend origins

---

## Troubleshooting

### CORS Errors
If you get "CORS policy" errors, ensure:
- Backend is running on `0.0.0.0:8000` (not `127.0.0.1:8000`)
- Frontend `.env` has correct `VITE_API_URL`
- `CORS_ALLOWED_ORIGINS` in backend `.env` includes frontend URL

### 401 Unauthorized Errors
If dashboard returns 401:
- Ensure you're logged in
- Check that auth tokens are stored in browser localStorage
- Verify JWT middleware in backend is working

### Dashboard Not Loading Data
- Check browser DevTools Network tab for API calls
- Verify backend endpoints are responding (use `http://localhost:8000/api/dashboard/summary/`)
- Check database has data (import citizens if needed)

---

## Common Commands

```bash
# Backend migrations
python manage.py migrate

# Import citizen data
python manage.py import_citizens

# Run tests
python manage.py test
npm run test  # frontend

# Build for production
npm run build  # frontend/frontend-mobile
python manage.py collectstatic  # backend
```
