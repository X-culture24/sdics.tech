/**
 * Service Worker for SDICS PWA
 * Handles offline caching, background sync, and push notifications
 */

const CACHE_NAME = 'sdics-v1';
const RUNTIME_CACHE = 'sdics-runtime-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
];

// Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests in offline mode (let them fail gracefully)
  if (request.url.includes('/api/')) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            // Return offline page for API failures
            return caches.match(OFFLINE_URL);
          });
        })
    );
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
            return response;
          })
          .catch(() => {
            // Return offline page if network fails
            return caches.match(OFFLINE_URL);
          })
      );
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for registration
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registration') {
    event.waitUntil(syncRegistration());
  }
});

async function syncRegistration() {
  try {
    const db = await openIndexedDB();
    const pendingRegistrations = await getPendingRegistrations(db);

    for (const registration of pendingRegistrations) {
      try {
        await fetch('/api/registrations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          body: JSON.stringify(registration),
        });

        // Remove from pending after successful sync
        await removePendingRegistration(db, registration.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sdics', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-registrations')) {
        db.createObjectStore('pending-registrations', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingRegistrations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-registrations', 'readonly');
    const store = transaction.objectStore('pending-registrations');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingRegistration(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-registrations', 'readwrite');
    const store = transaction.objectStore('pending-registrations');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(undefined);
  });
}

async function getAccessToken() {
  // Access token would be stored in localStorage or IndexedDB
  // This is a placeholder
  return localStorage.getItem('sdics_access_token') || '';
}
