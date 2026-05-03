'use client';

import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useState } from 'react';

import type { api } from '@/../convex/_generated/api';
import { AIPanel } from '@/components/editor/ai-panel';

import { Editor } from './editor';
import { Navbar } from './navbar';
import { Room } from './room';
import { Toolbar } from './toolbar';

interface DocumentProps {
  preloadedDocument: Preloaded<typeof api.documents.getById>;
  roomId: string;
}

export const Document = ({ preloadedDocument, roomId }: DocumentProps) => {
  const document = usePreloadedQuery(preloadedDocument);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <Room key={roomId} roomId={roomId}>
      <div className="min-h-screen bg-[#fafbfd]">
        <div className="fixed inset-x-0 top-0 z-10 flex flex-col gap-y-2 bg-[#FAFBFD] px-4 pt-2 print:hidden">
          <Navbar data={document} />
          <Toolbar onAIToggle={() => setAiOpen((v) => !v)} aiPanelOpen={aiOpen} />
        </div>

        <div className="flex pt-[114px] print:pt-0">
          <div className="flex-1 min-w-0">
            <Editor key={roomId} initialContent={document.initialContent} />
          </div>

          {aiOpen && (
            <div className="fixed right-0 top-[114px] bottom-0 z-20 print:hidden">
              <AIPanel onClose={() => setAiOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </Room>
  );
};