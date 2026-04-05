// convex/versions.ts — NEW
// Version history: persist Yjs snapshots, list and restore them.

import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    documentId: v.id('documents'),
    snapshot: v.bytes(),
    label: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Unauthorized!');

    return ctx.db.insert('versions', {
      documentId: args.documentId,
      snapshot: args.snapshot,
      label: args.label,
      createdAt: args.createdAt,
      createdBy: args.createdBy,
    });
  },
});

export const remove = mutation({
  args: { id: v.id('versions') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Unauthorized!');
    await ctx.db.delete(id);
  },
});

// ── Queries ───────────────────────────────────────────────────────────────────

export const get = query({
  args: { id: v.id('versions') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Unauthorized!');
    return ctx.db.get(id);
  },
});

export const listByDocument = query({
  args: {
    documentId: v.id('documents'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { documentId, limit = 20 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Unauthorized!');

    // Fetch one extra to detect hasMore without a COUNT query
    const rows = await ctx.db
      .query('versions')
      .withIndex('by_document', (q) => q.eq('documentId', documentId))
      .order('desc')
      .take(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
    };
  },
});
