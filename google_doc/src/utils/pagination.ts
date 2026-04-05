export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Build a cursor-based response.
 * Fetch `limit + 1` from your data source — the extra item detects hasMore.
 */
export function buildCursorResponse<T extends { _id: string }>(items: T[], limit: number): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return { items: page, nextCursor: hasMore ? page[page.length - 1]._id : null, hasMore };
}

export function parseLimit(searchParams: URLSearchParams, defaultVal = 20, max = 50): number {
  const raw = parseInt(searchParams.get('limit') ?? '', 10);
  if (isNaN(raw) || raw < 1) return defaultVal;
  return Math.min(raw, max);
}
