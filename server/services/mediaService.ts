import { db } from '../db/database.js';
import path from 'path';
import fs from 'fs';

export interface MediaAsset {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  imported_at: string;
  notes: string | null;
}

/**
 * Import media file(s) - simplified without duplicate detection
 */
export async function importMedia(
  filePath: string,
  copyToUploads = true,
  uploadsDir = 'uploads'
): Promise<{ asset: MediaAsset }> {
  // Copy file to uploads if needed
  let finalPath = filePath;
  if (copyToUploads) {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const newFileName = `${baseName}_${timestamp}${ext}`;
    finalPath = path.join(uploadsDir, newFileName);
    await fs.promises.copyFile(filePath, finalPath);
  }

  // Get file stats
  const stats = await fs.promises.stat(finalPath);
  const fileName = path.basename(finalPath);

  // Insert new asset
  const result = db.prepare(`
    INSERT INTO media_assets (file_path, file_name, file_size, mime_type, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(finalPath, fileName, stats.size, getMimeType(fileName), null);

  const asset = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(result.lastInsertRowid) as MediaAsset;

  return { asset };
}

/**
 * Get all media assets
 */
export function getAllMedia(): MediaAsset[] {
  return db.prepare('SELECT * FROM media_assets ORDER BY imported_at DESC').all() as MediaAsset[];
}

/**
 * Get media asset by ID
 */
export function getMediaById(id: number): MediaAsset | undefined {
  return db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as MediaAsset | undefined;
}

/**
 * Delete media asset
 */
export function deleteMedia(id: number): void {
  db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
}

/**
 * Find where a media asset has been used
 */
export function findMediaUsage(mediaId: number) {
  const batches = db.prepare(`
    SELECT b.* FROM batches b
    JOIN batch_media bm ON b.id = bm.batch_id
    WHERE bm.media_id = ?
  `).all(mediaId);

  const posts = db.prepare(`
    SELECT p.*, a.name as account_name, pl.display_name as platform_name
    FROM posts p
    JOIN post_media pm ON p.id = pm.post_id
    JOIN accounts a ON p.account_id = a.id
    JOIN platforms pl ON p.platform_id = pl.id
    WHERE pm.media_id = ?
    ORDER BY p.scheduled_at DESC, p.created_at DESC
  `).all(mediaId);

  return { batches, posts };
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
