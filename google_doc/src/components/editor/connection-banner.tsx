'use client';

import { useConnectionStatus } from '@/hooks/use-connection-status';

export function ConnectionBanner() {
  const { liveblocksStatus, isOffline, isDegraded } = useConnectionStatus();

  if (!isDegraded) return null;

  let message = '';
  let cls = '';

  if (isOffline) {
    message = 'You are offline. Changes will sync automatically when you reconnect.';
    cls = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (liveblocksStatus === 'reconnecting') {
    message = 'Reconnecting to collaboration server…';
    cls = 'bg-yellow-50 text-yellow-800 border-yellow-200';
  } else {
    message = 'Disconnected from collaboration server. Your edits are saved locally.';
    cls = 'bg-red-50 text-red-800 border-red-200';
  }

  return (
    <div className={`w-full px-4 py-2 text-sm text-center border-b ${cls}`} role="alert">
      {liveblocksStatus === 'reconnecting' && (
        <span className="inline-block animate-spin mr-1">⟳</span>
      )}
      {message}
    </div>
  );
}
