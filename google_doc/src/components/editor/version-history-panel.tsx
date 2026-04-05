'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface Version {
  _id: string;
  label?: string | null;
  createdAt: number;
  createdBy: string;
}

interface Props {
  docId: Id<'documents'>;
  onRestore?: (versionId: string) => Promise<void>;
  onClose?: () => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function VersionHistoryPanel({ docId, onRestore, onClose }: Props) {
  const result = useQuery(api.versions.listByDocument, { documentId: docId, limit: 30 });
  const versions = result?.items as Version[] | undefined;
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(id: string) {
    if (!onRestore) return;
    setRestoringId(id);
    try { await onRestore(id); } finally { setRestoringId(null); }
  }

  return (
    <aside className="w-72 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <span className="text-sm font-medium">Version history</span>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {versions === undefined && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {versions?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No versions saved yet.</p>}
        {versions?.map((v) => (
          <div key={v._id} className="p-3 border-b hover:bg-muted/40 transition-colors group">
            <p className="text-sm font-medium">{v.label ?? 'Auto-save'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(v.createdAt)}</p>
            {onRestore && (
              <button
                disabled={restoringId === v._id}
                onClick={() => handleRestore(v._id)}
                className="mt-1.5 text-xs text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {restoringId === v._id ? 'Restoring…' : 'Restore this version'}
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
