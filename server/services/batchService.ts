import { db } from '../db/database.js';

export interface Batch {
  id: number;
  name: string;
  description: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchWithMedia extends Batch {
  media: any[];
}

/**
 * Create a new batch
 */
export function createBatch(name: string, description?: string, tags?: string[]): Batch {
  const tagsStr = tags ? tags.join(',') : null;
  const result = db.prepare(`
    INSERT INTO batches (name, description, tags)
    VALUES (?, ?, ?)
  `).run(name, description || null, tagsStr);

  return db.prepare('SELECT * FROM batches WHERE id = ?').get(result.lastInsertRowid) as Batch;
}

/**
 * Get all batches with media count
 */
export function getAllBatches() {
  return db.prepare(`
    SELECT b.*, COUNT(bm.media_id) as media_count
    FROM batches b
    LEFT JOIN batch_media bm ON b.id = bm.batch_id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all();
}

/**
 * Get batch by ID with media
 */
export function getBatchById(id: number): BatchWithMedia | undefined {
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id) as Batch | undefined;
  if (!batch) return undefined;

  const media = db.prepare(`
    SELECT m.*, bm.sort_order
    FROM media_assets m
    JOIN batch_media bm ON m.id = bm.media_id
    WHERE bm.batch_id = ?
    ORDER BY bm.sort_order
  `).all(id);

  return { ...batch, media };
}

/**
 * Add media to batch
 */
export function addMediaToBatch(batchId: number, mediaIds: number[]): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO batch_media (batch_id, media_id, sort_order)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction((batchId: number, mediaIds: number[]) => {
    mediaIds.forEach((mediaId, index) => {
      stmt.run(batchId, mediaId, index);
    });
  });

  transaction(batchId, mediaIds);
}

/**
 * Remove media from batch
 */
export function removeMediaFromBatch(batchId: number, mediaId: number): void {
  db.prepare('DELETE FROM batch_media WHERE batch_id = ? AND media_id = ?').run(batchId, mediaId);
}

/**
 * Update batch
 */
export function updateBatch(id: number, updates: Partial<Batch>): Batch {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(updates.tags);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE batches SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  
  return db.prepare('SELECT * FROM batches WHERE id = ?').get(id) as Batch;
}

/**
 * Delete batch
 */
export function deleteBatch(id: number): void {
  db.prepare('DELETE FROM batches WHERE id = ?').run(id);
}

/**
 * Find where a batch has been used
 */
export function findBatchUsage(batchId: number) {
  return db.prepare(`
    SELECT p.*, a.name as account_name, pl.display_name as platform_name
    FROM posts p
    JOIN post_batches pb ON p.id = pb.post_id
    JOIN accounts a ON p.account_id = a.id
    JOIN platforms pl ON p.platform_id = pl.id
    WHERE pb.batch_id = ?
    ORDER BY p.scheduled_at DESC, p.created_at DESC
  `).all(batchId);
}
