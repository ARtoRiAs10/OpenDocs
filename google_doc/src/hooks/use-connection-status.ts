'use client';

import { useEffect, useState } from 'react';
import { useStatus } from '@liveblocks/react/suspense';

export type LiveblocksStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface ConnectionState {
  liveblocksStatus: LiveblocksStatus;
  isOffline: boolean;
  /** True when we should show a warning to the user */
  isDegraded: boolean;
}

export function useConnectionStatus(): ConnectionState {
  const liveblocksStatus = useStatus() as LiveblocksStatus;
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const isDegraded = isOffline || liveblocksStatus === 'reconnecting' || liveblocksStatus === 'disconnected';

  return { liveblocksStatus, isOffline, isDegraded };
}
