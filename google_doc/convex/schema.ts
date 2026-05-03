import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    initialContent: v.optional(v.string()),
    ownerId: v.string(),
    roomId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),        
    roomAccess: v.optional(v.array(v.string())), 
  })
    .index('by_owner_id', ['ownerId'])
    .index('by_organization_id', ['organizationId'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'organizationId'],
    }),

  versions: defineTable({
    documentId: v.id('documents'),
    snapshot: v.bytes(),
    label: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.string(),
  }).index('by_document', ['documentId', 'createdAt']),
});