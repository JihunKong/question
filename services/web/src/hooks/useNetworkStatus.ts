'use client';

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isSlowConnection: false,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection;
      
      setStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection ? 
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.saveData === true : false,
        effectiveType: connection?.effectiveType,
      });
    };

    // Initial check
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Network Information API
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return status;
}

export function useOfflineSync() {
  const [pendingSync, setPendingSync] = useState<number>(0);

  useEffect(() => {
    const checkPendingSync = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Get pending sync count from service worker
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_PENDING_COUNT',
        });
      }
    };

    checkPendingSync();

    // Listen for sync updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PENDING_COUNT') {
        setPendingSync(event.data.count);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const syncNow = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_NOW',
      });
    }
  };

  return { pendingSync, syncNow };
}