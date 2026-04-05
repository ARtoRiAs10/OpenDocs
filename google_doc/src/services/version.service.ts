import * as Y from 'yjs';

/** Capture a Yjs snapshot and persist it to Convex. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createSnapshot(convex: any, docId: string, ydoc: Y.Doc, userId: string, label?: string): Promise<string> {
  const snapshot = Y.encodeStateAsUpdateV2(ydoc);
  return convex.mutation('versions:create', {
    documentId: docId,
    snapshot: Array.from(snapshot),
    label: label ?? null,
    createdAt: Date.now(),
    createdBy: userId,
  });
}

/** Apply a stored snapshot onto the current Yjs doc (CRDT-safe merge). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function restoreSnapshot(convex: any, versionId: string, ydoc: Y.Doc): Promise<void> {
  const version = await convex.query('versions:get', { id: versionId });
  if (!version) throw new Error(`Version ${versionId} not found`);
  Y.applyUpdateV2(ydoc, new Uint8Array(version.snapshot as number[]));
}

/** List versions newest-first with pagination. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listVersions(convex: any, docId: string, limit = 20) {
  return convex.query('versions:listByDocument', { documentId: docId, limit });
}
