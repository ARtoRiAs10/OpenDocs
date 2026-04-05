import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    initialContent: v.optional(v.string()),
    ownerId: v.string(),
    roomId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  })
    .index('by_owner_id', ['ownerId'])
    .index('by_organization_id', ['organizationId'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'organizationId'],
    }),

  // NEW: Version history snapshots (Yjs binary state)
  versions: defineTable({
    documentId: v.id('documents'),
    snapshot: v.bytes(),               // Y.encodeStateAsUpdateV2 output
    label: v.optional(v.string()),     // user-named e.g. "Before client meeting"
    createdAt: v.number(),             // Unix ms
    createdBy: v.string(),             // Clerk userId
  }).index('by_document', ['documentId', 'createdAt']),
});
