import { db } from '../db/database.js';
import { Post } from './postService.js';

export interface ConflictWarning {
  type: 'time_conflict';
  severity: 'warning' | 'error';
  message: string;
  conflictingPosts?: any[];
  details?: any;
}

/**
 * Check for conflicts - only time-based conflicts now
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

  // Time conflicts only
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
        message: `Scheduling conflict: ${timeConflicts.length} other post(s) scheduled at the same time`,
        conflictingPosts: timeConflicts,
      });
    }
  }

  return warnings;
}

/**
 * Check for time conflicts (posts scheduled within configured time window on same platform)
 * Default window is 15 minutes
 */
function checkTimeConflicts(
  scheduledAt: string,
  platformId: number,
  excludePostId?: number
): any[] {
  const config = getConfig();
  const windowMinutes = parseInt(config.conflict_window_minutes || '15', 10);
  
  // Convert scheduledAt to a Date and calculate window bounds
  const targetTime = new Date(scheduledAt);
  const windowStart = new Date(targetTime.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + windowMinutes * 60 * 1000);

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
    ? [platformId, windowStart.toISOString(), windowEnd.toISOString(), excludePostId]
    : [platformId, windowStart.toISOString(), windowEnd.toISOString()];

  return query.all(...params);
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
