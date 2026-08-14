# SDICS Frontend - Production-Ready React TypeScript PWA

A comprehensive Progressive Web Application for the Citizen Registration and Monitoring System (SDICS) built with React, TypeScript, Material UI, and modern web standards.

## Features

### ✅ Complete Feature Set

- **Authentication**: National ID + PIN login with JWT tokens (15-min access, 7-day refresh)
- **Dashboard**: Real-time metrics with charts (bar, line charts via Recharts)
- **Citizen Management**: Server-side search with pagination and geographic filtering
- **Registration Workflow**: Streamlined citizen registration with confirmation
- **Officer PWA**: Mobile-first interface, installable on Android/iOS
- **Offline Support**: Graceful offline handling, cached responses, background sync
- **Responsive Design**: Desktop, tablet, mobile optimized
- **Government-Style UI**: Professional theme with Kenya government colors

### 📊 Dashboard Metrics

- Total citizens, registered/unregistered counts
- Registration percentage and progress
- Today's registration count
- Active officers count
- County performance bar chart
- 7-day registration trend line chart
- All metrics server-calculated, never frontend-computed

### 🔍 Citizen Search

- Server-side pagination (25-100 per page, max 100)
- Multi-field search: National ID, Full Name
- Geographic hierarchy filtering: County → District → Division → Location
- Instant filter cascading
- Registration status filtering
- Zero-tolerance for loading 1.8M citizens into browser

### 📱 PWA Capabilities

- Installable on Android/iOS/PWA browsers
- Offline-first with service worker caching
- Background sync for registrations
- Push notifications support
- Device info capture (OS, browser, device type)
- Works with/without internet connection

### 🔐 Security

- JWT tokens in httpOnly cookies (not localStorage)
- Automatic token refresh with 401 interception
- Refresh token revocation on logout
- Role-based access control (REGISTRATION_OFFICER, SUPERVISOR, ADMINISTRATOR)
- Protected routes by role
- XSS protection via React's built-in sanitization
- CSRF tokens handled by Django backend

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.2.0 |
| Language | TypeScript | 5.3.0 |
| Build Tool | Vite | 5.0.0 |
| UI Library | Material UI | 5.14.0 |
| Routing | React Router | 6.20.0 |
| HTTP Client | Axios | 1.6.0 |
| State Management | React Query | 5.28.0 |
| Forms | React Hook Form | 7.50.0 |
| Charts | Recharts | 2.10.0 |
| PWA | Workbox | 7.0.0 |

## Project Structure

```
frontend/
├── src/
│   ├── assets/                    # Images, icons, logos
│   ├── components/
│   │   ├── auth/                 # ProtectedRoute, authentication components
│   │   ├── layout/               # AppShell, navigation, sidebar
│   │   ├── common/               # Reusable UI components
│   │   ├── forms/                # Form components (if needed)
│   │   └── tables/               # Table components (if needed)
│   ├── features/                 # Feature-specific components (optional)
│   ├── pages/                    # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CitizenSearchPage.tsx
│   │   ├── CitizenRegisterPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   └── api/                  # API clients
│   │       ├── client.ts         # Axios instance, JWT handling
│   │       ├── citizens.ts       # Citizen endpoints
│   │       ├── registration.ts   # Registration endpoints
│   │       ├── dashboard.ts      # Dashboard endpoints
│   │       ├── officers.ts       # Officer management endpoints
│   │       ├── campaigns.ts      # Campaign endpoints
│   │       └── audit.ts          # Audit log endpoints
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useCitizens.ts        # Citizen queries
│   │   ├── useDashboard.ts       # Dashboard queries
│   │   └── useRegistration.ts    # Registration mutations
│   ├── types/                    # TypeScript interfaces
│   ├── utils/                    # Utilities
│   │   └── pwa.ts               # PWA utilities
│   ├── theme/                    # Material UI theme
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── service-worker.js         # Service worker for offline/caching
│   ├── offline.html              # Offline fallback page
│   └── icons/                    # App icons (various sizes)
├── index.html                    # HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend running at `http://localhost:8000` (configurable)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your backend URL:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_TITLE=SDICS
VITE_APP_VERSION=1.0.0
```

### 3. Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Build for Production

```bash
npm run build
```

Output in `frontend/dist/`

### 5. Preview Production Build

```bash
npm run preview
```

## API Integration

### Authentication Flow

1. Officer enters National ID + PIN on `/login`
2. Frontend calls `POST /api/auth/login/`
3. Backend returns access_token + refresh_token
4. Tokens stored in localStorage, used in Authorization header
5. On 401, frontend calls `POST /api/auth/refresh/`
6. New access token issued and operation retried
7. On logout, `POST /api/auth/logout/` revokes refresh token

### Citizen Search

Never loads all 1.8M records. Uses server-side pagination:

```typescript
// Defaults to 25 per page, max 100
const results = await citizensApi.search({
  national_id: '12345678',
  full_name: 'John Doe',
  county: 'Nairobi',
  district: 'Westlands',
  page: 1,
  page_size: 25,
});
```

### Dashboard Metrics

All statistics calculated by backend, cached for 30 seconds:

```typescript
const summary = await dashboardApi.getSummary();
// Returns: { total_citizens, registered_count, registration_percentage, ... }
```

### Registration

Records officer, timestamp, device info on backend:

```typescript
await registrationApi.registerCitizen(citizenId);
// Captures: device type, OS, browser, app version
```

## Development Guidelines

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Import in AppShell for navigation
4. Use `@hooks/` for data fetching

### Adding API Endpoints

1. Create service in `src/services/api/`
2. Use `apiClient` for requests
3. Export typed functions
4. Create custom hook in `src/hooks/`

### State Management

- Use React Query for server state (data from API)
- Use React hooks for UI state
- useAuth() for authentication state
- Queries auto-invalidate after mutations

### Authentication

Protected routes use `<ProtectedRoute>` component:

```tsx
<ProtectedRoute requiredRoles={['ADMINISTRATOR']}>
  <AdminPage />
</ProtectedRoute>
```

## PWA Features

### Installation

1. Visit frontend URL
2. Click "Install" prompt or use browser menu
3. Add to home screen
4. Works offline with cached pages

### Offline Support

- Service worker caches static assets
- API requests show "offline" status
- Users see which features require internet
- No false "success" notifications for offline registrations

### Background Sync

- Pending registrations stored in IndexedDB
- Auto-synced when online
- Graceful fallback if sync fails

## Performance Optimizations

### React Query Caching

- Dashboard: 30-second cache, 30-second auto-refresh
- Citizens: 30-second cache
- Location hierarchies: 1-hour cache
- Automatic invalidation after mutations

### Code Splitting

- Vite automatically splits by route
- Vendor bundles (React, MUI, Query) separate
- Charts bundle separate for lazy loading

### Lazy Loading

- Dashboard charts lazy-loaded
- Tables virtualized for large datasets
- Route-based code splitting

## Testing

### Unit Tests (To Be Added)

```bash
npm run test
```

### E2E Tests (To Be Added)

```bash
npm run test:e2e
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Deployment

### Docker Build

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name sdics.example.com;

    location / {
        root /var/www/sdics;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
    }

    location /ws {
        proxy_pass ws://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS 14+, Android 9+)

## Troubleshooting

### Service Worker Not Updating

Clear browser cache or use DevTools > Application > Service Workers > Unregister

### CORS Issues

Ensure backend sets proper CORS headers. Backend proxy configured in `vite.config.ts`

### Token Expired

Frontend automatically refreshes tokens. If refresh fails, redirect to login.

### Offline Features Not Working

Check PWA installation and service worker registration in DevTools.

## Contributing

1. Follow existing code style
2. Add TypeScript types for new data
3. Use React Query for server state
4. Test with different screen sizes
5. Verify API contracts with backend

## License

© 2024 SDICS. All rights reserved.

## Support

For issues or questions:
1. Check backend API documentation
2. Review error messages in browser console
3. Check service worker status
4. Verify network requests in DevTools
