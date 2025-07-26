const CACHE_NAME = 'question-exchange-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js',
];

// Essential data for offline functionality
const OFFLINE_API_CACHE = 'offline-api-v1';
const PENDING_SYNC_CACHE = 'pending-sync-v1';

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    const response = await fetch(request.clone());
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(OFFLINE_API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Check if we have a cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For POST requests, save to pending sync
    if (request.method === 'POST') {
      await savePendingRequest(request);
      return new Response(
        JSON.stringify({
          success: true,
          offline: true,
          message: '오프라인 상태입니다. 연결이 복구되면 자동으로 동기화됩니다.'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        error: '오프라인 상태입니다.'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// Save pending requests for later sync
async function savePendingRequest(request) {
  const cache = await caches.open(PENDING_SYNC_CACHE);
  const timestamp = new Date().toISOString();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: [...request.headers],
    body: await request.text(),
    timestamp
  };
  
  const pendingRequest = new Request(`/_pending/${timestamp}`, {
    method: 'PUT',
    body: JSON.stringify(requestData)
  });
  
  await cache.put(pendingRequest, new Response('pending'));
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  const cache = await caches.open(PENDING_SYNC_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    if (request.url.includes('/_pending/')) {
      try {
        const response = await cache.match(request);
        const requestData = JSON.parse(await response.text());
        
        // Recreate and send the original request
        const originalRequest = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        const fetchResponse = await fetch(originalRequest);
        
        if (fetchResponse.ok) {
          // Remove from pending cache if successful
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }
  }
}

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, OFFLINE_API_CACHE, PENDING_SYNC_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_NOW') {
    syncPendingRequests();
  }
});