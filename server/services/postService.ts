import { db } from '../db/database.js';

export interface Post {
  id: number;
  account_id: number;
  platform_id: number;
  status: 'draft' | 'scheduled' | 'posted' | 'archived';
  caption: string | null;
  caption_version: number;
  scheduled_at: string | null;
  posted_at: string | null;
  post_url: string | null;
  post_external_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithDetails extends Post {
  account_name: string;
  platform_name: string;
  media: any[];
  batches: any[];
}

export interface ConflictWarning {
  type: 'time_conflict' | 'media_reuse' | 'cross_account_same_day';
  severity: 'warning' | 'error';
  message: string;
  conflictingPosts?: any[];
}

/**
 * Create a new post
 */
export function createPost(data: {
  accountId: number;
  platformId: number;
  status: Post['status'];
  caption?: string;
  scheduledAt?: string;
  notes?: string;
  mediaIds?: number[];
  batchIds?: number[];
}): Post {
  const result = db.prepare(`
    INSERT INTO posts (account_id, platform_id, status, caption, scheduled_at, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.accountId,
    data.platformId,
    data.status,
    data.caption || null,
    data.scheduledAt || null,
    data.notes || null
  );

  const postId = result.lastInsertRowid as number;

  // Add media
  if (data.mediaIds && data.mediaIds.length > 0) {
    const stmt = db.prepare('INSERT INTO post_media (post_id, media_id, sort_order) VALUES (?, ?, ?)');
    const transaction = db.transaction(() => {
      data.mediaIds!.forEach((mediaId, index) => {
        stmt.run(postId, mediaId, index);
      });
    });
    transaction();
  }

  // Add batches
  if (data.batchIds && data.batchIds.length > 0) {
    const stmt = db.prepare('INSERT INTO post_batches (post_id, batch_id) VALUES (?, ?)');
    const transaction = db.transaction(() => {
      data.batchIds!.forEach((batchId) => {
        stmt.run(postId, batchId);
      });
    });
    transaction();
  }

  // Save caption history
  if (data.caption) {
    db.prepare(`
      INSERT INTO caption_history (post_id, version, caption)
      VALUES (?, 1, ?)
    `).run(postId, data.caption);
  }

  return db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as Post;
}

/**
 * Get all posts with details
 */
export function getAllPosts(): PostWithDetails[] {
  const posts = db.prepare(`
    SELECT p.*, a.name as account_name, pl.display_name as platform_name
    FROM posts p
    JOIN accounts a ON p.account_id = a.id
    JOIN platforms pl ON p.platform_id = pl.id
    ORDER BY 
      CASE 
        WHEN p.scheduled_at IS NOT NULL THEN p.scheduled_at 
        ELSE p.created_at 
      END DESC
  `).all() as PostWithDetails[];

  // Attach media and batches to each post
  for (const post of posts) {
    post.media = db.prepare(`
      SELECT m.*, pm.sort_order
      FROM media_assets m
      JOIN post_media pm ON m.id = pm.media_id
      WHERE pm.post_id = ?
      ORDER BY pm.sort_order
    `).all(post.id);

    post.batches = db.prepare(`
      SELECT b.*
      FROM batches b
      JOIN post_batches pb ON b.id = pb.batch_id
      WHERE pb.post_id = ?
    `).all(post.id);
  }

  return posts;
}

/**
 * Get post by ID with details
 */
export function getPostById(id: number): PostWithDetails | undefined {
  const post = db.prepare(`
    SELECT p.*, a.name as account_name, pl.display_name as platform_name
    FROM posts p
    JOIN accounts a ON p.account_id = a.id
    JOIN platforms pl ON p.platform_id = pl.id
    WHERE p.id = ?
  `).get(id) as PostWithDetails | undefined;

  if (!post) return undefined;

  post.media = db.prepare(`
    SELECT m.*, pm.sort_order
    FROM media_assets m
    JOIN post_media pm ON m.id = pm.media_id
    WHERE pm.post_id = ?
    ORDER BY pm.sort_order
  `).all(id);

  post.batches = db.prepare(`
    SELECT b.*
    FROM batches b
    JOIN post_batches pb ON b.id = pb.batch_id
    WHERE pb.post_id = ?
  `).all(id);

  return post;
}

/**
 * Update post
 */
export function updatePost(id: number, updates: Partial<Post>): Post {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.caption !== undefined) {
    fields.push('caption = ?');
    values.push(updates.caption);
    
    // Increment version and save to history
    const currentPost = db.prepare('SELECT caption_version FROM posts WHERE id = ?').get(id) as { caption_version: number };
    const newVersion = currentPost.caption_version + 1;
    fields.push('caption_version = ?');
    values.push(newVersion);
    
    db.prepare(`
      INSERT INTO caption_history (post_id, version, caption)
      VALUES (?, ?, ?)
    `).run(id, newVersion, updates.caption);
  }
  if (updates.scheduled_at !== undefined) {
    fields.push('scheduled_at = ?');
    values.push(updates.scheduled_at);
  }
  if (updates.posted_at !== undefined) {
    fields.push('posted_at = ?');
    values.push(updates.posted_at);
  }
  if (updates.post_url !== undefined) {
    fields.push('post_url = ?');
    values.push(updates.post_url);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as Post;
}

/**
 * Delete post
 */
export function deletePost(id: number): void {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

/**
 * Get posts by date range
 */
export function getPostsByDateRange(startDate: string, endDate: string) {
  return db.prepare(`
    SELECT p.*, a.name as account_name, pl.display_name as platform_name
    FROM posts p
    JOIN accounts a ON p.account_id = a.id
    JOIN platforms pl ON p.platform_id = pl.id
    WHERE (p.scheduled_at BETWEEN ? AND ?) OR (p.posted_at BETWEEN ? AND ?)
    ORDER BY COALESCE(p.scheduled_at, p.posted_at)
  `).all(startDate, endDate, startDate, endDate);
}

/**
 * Search posts
 */
export function searchPosts(query: string) {
  const pattern = `%${query}%`;
  return db.prepare(`
    SELECT DISTINCT p.*, a.name as account_name, pl.display_name as platform_name
    FROM posts p
    JOIN accounts a ON p.account_id = a.id
    JOIN platforms pl ON p.platform_id = pl.id
    WHERE p.caption LIKE ? OR p.notes LIKE ? OR a.name LIKE ? OR pl.display_name LIKE ?
    ORDER BY p.created_at DESC
  `).all(pattern, pattern, pattern, pattern);
}
