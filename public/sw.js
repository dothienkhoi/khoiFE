// Service Worker for Web Push Notifications
// This file handles push notifications when the app is in the background

const CACHE_NAME = 'fastbite-admin-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    clients.claim()
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received', event);
  
  let notificationData = {
    title: 'FastBite Group Admin',
    body: 'Bạn có thông báo mới',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'admin-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Xem ngay',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Bỏ qua'
      }
    ],
    data: {
      url: '/admin/notifications',
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.message || pushData.body || notificationData.body,
        data: {
          ...notificationData.data,
          url: pushData.linkTo || notificationData.data.url,
          notificationId: pushData.id,
          ...pushData.data
        }
      };

      // For critical alerts, require user interaction
      if (pushData.isCritical) {
        notificationData.requireInteraction = true;
        notificationData.tag = 'critical-alert';
      }
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event);
  
  const notification = event.notification;
  const action = event.action;
  
  notification.close();

  if (action === 'dismiss') {
    return;
  }

  // Handle click - open the app or focus existing window
  const urlToOpen = notification.data?.url || '/admin/notifications';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline notifications (optional)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Could implement offline notification queueing here
      Promise.resolve()
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker script loaded');
