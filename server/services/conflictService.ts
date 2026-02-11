import { db } from '../db/database.js';
import { Post } from './postService.js';

export interface ConflictWarning {
  type: 'time_conflict' | 'media_reuse' | 'cross_account_same_day' | 'batch_reuse';
  severity: 'warning' | 'error';
  message: string;
  conflictingPosts?: any[];
  details?: any;
}

/**
 * Check for all conflicts for a given post
 */
export function checkConflicts(post: {
  id?: number;
  accountId: number;
  platformId: number;
  scheduledAt?: string;
  mediaIds?: number[];
  batchIds?: number[];
}): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];

  // Get config
  const config = getConfig();

  // Time conflicts
  if (post.scheduledAt && config.warn_time_conflicts === 'true') {
    const timeConflicts = checkTimeConflicts(
      post.scheduledAt,
      post.platformId,
      post.id
    );
    if (timeConflicts.length > 0) {
      warnings.push({
        type: 'time_conflict',
        severity: 'warning',
        message: `Scheduling conflict: ${timeConflicts.length} other post(s) scheduled around the same time`,
        conflictingPosts: timeConflicts,
      });
    }
  }

  // Media reuse conflicts
  if (post.mediaIds && post.mediaIds.length > 0) {
    const minDays = parseInt(config.min_days_before_reuse || '7');
    const mediaConflicts = checkMediaReuse(
      post.mediaIds,
      post.scheduledAt,
      minDays,
      post.id
    );
    if (mediaConflicts.length > 0) {
      warnings.push({
        type: 'media_reuse',
        severity: 'warning',
        message: `Media reuse detected: ${mediaConflicts.length} asset(s) used within ${minDays} days`,
        conflictingPosts: mediaConflicts,
        details: { minDays },
      });
    }
  }

  // Batch reuse conflicts
  if (post.batchIds && post.batchIds.length > 0) {
    const minDays = parseInt(config.min_days_before_reuse || '7');
    const batchConflicts = checkBatchReuse(
      post.batchIds,
      post.scheduledAt,
      minDays,
      post.id
    );
    if (batchConflicts.length > 0) {
      warnings.push({
        type: 'batch_reuse',
        severity: 'warning',
        message: `Batch reuse detected: ${batchConflicts.length} batch(es) used within ${minDays} days`,
        conflictingPosts: batchConflicts,
        details: { minDays },
      });
    }
  }

  // Cross-account same-day conflicts
  if (
    config.warn_same_day_cross_account === 'true' &&
    post.scheduledAt &&
    post.mediaIds &&
    post.mediaIds.length > 0
  ) {
    const crossAccountConflicts = checkCrossAccountSameDay(
      post.mediaIds,
      post.accountId,
      post.scheduledAt,
      post.id
    );
    if (crossAccountConflicts.length > 0) {
      warnings.push({
        type: 'cross_account_same_day',
        severity: 'warning',
        message: `Cross-account conflict: Same media appears on another account on the same day`,
        conflictingPosts: crossAccountConflicts,
      });
    }
  }

  return warnings;
}

/**
 * Check for time conflicts (posts scheduled within 30 minutes)
 */
function checkTimeConflicts(
  scheduledAt: string,
  platformId: number,
  excludePostId?: number
): any[] {
  const scheduledDate = new Date(scheduledAt);
  const before = new Date(scheduledDate.getTime() - 30 * 60000).toISOString();
  const after = new Date(scheduledDate.getTime() + 30 * 60000).toISOString();

  const query = excludePostId
    ? db.prepare(`
        SELECT p.*, a.name as account_name, pl.display_name as platform_name
        FROM posts p
        JOIN accounts a ON p.account_id = a.id
        JOIN platforms pl ON p.platform_id = pl.id
        WHERE p.platform_id = ?
          AND p.scheduled_at BETWEEN ? AND ?
          AND p.status IN ('draft', 'scheduled')
          AND p.id != ?
      `)
    : db.prepare(`
        SELECT p.*, a.name as account_name, pl.display_name as platform_name
        FROM posts p
        JOIN accounts a ON p.account_id = a.id
        JOIN platforms pl ON p.platform_id = pl.id
        WHERE p.platform_id = ?
          AND p.scheduled_at BETWEEN ? AND ?
          AND p.status IN ('draft', 'scheduled')
      `);

  const params = excludePostId
    ? [platformId, before, after, excludePostId]
    : [platformId, before, after];

  return query.all(...params);
}

/**
 * Check for media reuse within min days
 */
function checkMediaReuse(
  mediaIds: number[],
  scheduledAt: string | undefined,
  minDays: number,
  excludePostId?: number
): any[] {
  if (!scheduledAt) return [];

  const scheduledDate = new Date(scheduledAt);
  const minDate = new Date(scheduledDate.getTime() - minDays * 86400000).toISOString();
  const maxDate = new Date(scheduledDate.getTime() + minDays * 86400000).toISOString();

  const placeholders = mediaIds.map(() => '?').join(',');
  const query = excludePostId
    ? `
      SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN platforms pl ON p.platform_id = pl.id
      JOIN post_media pm ON p.id = pm.post_id
      WHERE pm.media_id IN (${placeholders})
        AND (p.scheduled_at BETWEEN ? AND ? OR p.posted_at BETWEEN ? AND ?)
        AND p.status != 'archived'
        AND p.id != ?
    `
    : `
      SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN platforms pl ON p.platform_id = pl.id
      JOIN post_media pm ON p.id = pm.post_id
      WHERE pm.media_id IN (${placeholders})
        AND (p.scheduled_at BETWEEN ? AND ? OR p.posted_at BETWEEN ? AND ?)
        AND p.status != 'archived'
    `;

  const params = excludePostId
    ? [...mediaIds, minDate, maxDate, minDate, maxDate, excludePostId]
    : [...mediaIds, minDate, maxDate, minDate, maxDate];

  return db.prepare(query).all(...params);
}

/**
 * Check for batch reuse within min days
 */
function checkBatchReuse(
  batchIds: number[],
  scheduledAt: string | undefined,
  minDays: number,
  excludePostId?: number
): any[] {
  if (!scheduledAt) return [];

  const scheduledDate = new Date(scheduledAt);
  const minDate = new Date(scheduledDate.getTime() - minDays * 86400000).toISOString();
  const maxDate = new Date(scheduledDate.getTime() + minDays * 86400000).toISOString();

  const placeholders = batchIds.map(() => '?').join(',');
  const query = excludePostId
    ? `
      SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN platforms pl ON p.platform_id = pl.id
      JOIN post_batches pb ON p.id = pb.post_id
      WHERE pb.batch_id IN (${placeholders})
        AND (p.scheduled_at BETWEEN ? AND ? OR p.posted_at BETWEEN ? AND ?)
        AND p.status != 'archived'
        AND p.id != ?
    `
    : `
      SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN platforms pl ON p.platform_id = pl.id
      JOIN post_batches pb ON p.id = pb.post_id
      WHERE pb.batch_id IN (${placeholders})
        AND (p.scheduled_at BETWEEN ? AND ? OR p.posted_at BETWEEN ? AND ?)
        AND p.status != 'archived'
    `;

  const params = excludePostId
    ? [...batchIds, minDate, maxDate, minDate, maxDate, excludePostId]
    : [...batchIds, minDate, maxDate, minDate, maxDate];

  return db.prepare(query).all(...params);
}

/**
 * Check for cross-account same-day conflicts
 */
function checkCrossAccountSameDay(
  mediaIds: number[],
  accountId: number,
  scheduledAt: string,
  excludePostId?: number
): any[] {
  const scheduledDate = new Date(scheduledAt);
  const dayStart = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()).toISOString();
  const dayEnd = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate() + 1).toISOString();

  const placeholders = mediaIds.map(() => '?').join(',');
  const query = excludePostId
    ? `
      SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN platforms pl ON p.platform_id = pl.id
      JOIN post_media pm ON p.id = pm.post_id
      WHERE pm.media_id IN (${placeholders})
        AND p.account_id != ?
        AND (
          (p.scheduled_at >= ? AND p.scheduled_at < ?) OR
          (p.posted_at >= ? AND p.posted_at < ?)
        )
        AND p.status != 'archived'
        AND p.id != ?
    `
    : `
      SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN platforms pl ON p.platform_id = pl.id
      JOIN post_media pm ON p.id = pm.post_id
      WHERE pm.media_id IN (${placeholders})
        AND p.account_id != ?
        AND (
          (p.scheduled_at >= ? AND p.scheduled_at < ?) OR
          (p.posted_at >= ? AND p.posted_at < ?)
        )
        AND p.status != 'archived'
    `;

  const params = excludePostId
    ? [...mediaIds, accountId, dayStart, dayEnd, dayStart, dayEnd, excludePostId]
    : [...mediaIds, accountId, dayStart, dayEnd, dayStart, dayEnd];

  return db.prepare(query).all(...params);
}

/**
 * Get configuration
 */
function getConfig(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM config').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

/**
 * Update configuration
 */
export function updateConfig(key: string, value: string): void {
  db.prepare('UPDATE config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(value, key);
}

/**
 * Get all configuration
 */
export function getAllConfig(): Record<string, string> {
  return getConfig();
}
