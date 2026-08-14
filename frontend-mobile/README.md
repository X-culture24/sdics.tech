# SDICS Officer Mobile App

Mobile-only PWA application for registration officers.

## Features

- **Mobile-First Design**: Optimized for mobile devices with bottom tab navigation
- **PWA Support**: Works offline with service worker caching
- **8 Core Features**:
  1. Officer Login (National ID + PIN)
  2. Today's Target Progress
  3. Citizen Registration
  4. Citizens List by County
  5. Officer Statistics
  6. Offline Support
  7. Mobile Notifications
  8. Data Sync

## Running

```bash
npm install
npm run dev
```

Runs on http://localhost:5175 (or next available port)

## Build

```bash
npm run build
```

## Testing

Login credentials:
- National ID: `12345678`
- PIN: `12345678`

## Architecture

- **Tabs**: Today's Target, Register, Citizens, Stats
- **Mobile-Only**: No responsive web design, mobile viewport optimized
- **Offline**: Service worker with cache-first strategy
- **API**: Connects to backend at http://localhost:8000

## Deployment

The PWA can be installed on mobile devices as a native app.
