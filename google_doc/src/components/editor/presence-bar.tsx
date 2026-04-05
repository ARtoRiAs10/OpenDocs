'use client';

import { useOthers, useSelf } from '@liveblocks/react/suspense';

const PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#0ea5e9'];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface AvatarProps { name: string; color: string; isSelf?: boolean }

function Avatar({ name, color, isSelf }: AvatarProps) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      title={isSelf ? `${name} (you)` : name}
      style={{ backgroundColor: color, outline: isSelf ? `2px solid ${color}` : 'none', outlineOffset: '2px' }}
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium select-none flex-shrink-0 cursor-default"
    >
      {initials || '?'}
    </div>
  );
}

const MAX_VISIBLE = 4;

export function PresenceBar() {
  const others = useOthers();
  const self = useSelf();
  const visible = others.slice(0, MAX_VISIBLE);
  const overflow = others.length - MAX_VISIBLE;
  const selfName = (self?.info as { name?: string })?.name ?? 'You';
  const selfId = self?.id ?? 'self';

  return (
    <div className="flex items-center gap-1.5 px-3 py-1">
      <Avatar name={selfName} color={colorForId(selfId)} isSelf />
      {visible.map((user) => {
        const info = user.info as { name?: string; color?: string };
        return (
          <Avatar key={user.connectionId} name={info?.name ?? 'Anonymous'} color={info?.color ?? colorForId(String(user.connectionId))} />
        );
      })}
      {overflow > 0 && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0" title={`${overflow} more`}>
          +{overflow}
        </div>
      )}
      <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">
        {others.length === 0 ? 'Just you' : `${others.length + 1} editing`}
      </span>
    </div>
  );
}
