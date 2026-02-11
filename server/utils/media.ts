import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import imageHash from 'image-hash';
import { promisify } from 'util';

const imageHashAsync = promisify(imageHash);

export interface MediaFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Compute SHA-256 hash of file contents
 */
export async function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Compute perceptual hash for images (detects similar images even if resized/compressed)
 */
export async function computePerceptualHash(filePath: string): Promise<string | null> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    if (!imageExtensions.includes(ext)) {
      return null;
    }

    const hash = await imageHashAsync(filePath, 16, true);
    return hash;
  } catch (error) {
    console.error('Error computing perceptual hash:', error);
    return null;
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    if (!imageExtensions.includes(ext)) {
      return null;
    }

    // Use sharp or similar library in production
    // For now, return null and handle in UI
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate Hamming distance between two hashes (for perceptual hash similarity)
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return Infinity;
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Check if two perceptual hashes are similar (threshold: max 5 bit difference)
 */
export function areHashesSimilar(hash1: string, hash2: string, threshold = 5): boolean {
  const distance = hammingDistance(hash1, hash2);
  return distance <= threshold;
}

/**
 * Copy file to uploads directory and return new path
 */
export async function copyToUploads(sourcePath: string, uploadsDir: string): Promise<string> {
  const fileName = path.basename(sourcePath);
  const timestamp = Date.now();
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  const newFileName = `${baseName}_${timestamp}${ext}`;
  const destPath = path.join(uploadsDir, newFileName);

  await fs.promises.copyFile(sourcePath, destPath);
  return destPath;
}

/**
 * Ensure uploads directory exists
 */
export function ensureUploadsDir(uploadsDir: string): void {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}
