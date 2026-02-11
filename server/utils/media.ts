import fs from 'fs';
import path from 'path';

export interface MediaFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Get image dimensions (placeholder - requires image processing library)
 */
export async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    if (!imageExtensions.includes(ext)) {
      return null;
    }

    // Placeholder: Would use image-size or similar library in production
    return null;
  } catch (error) {
    return null;
  }
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
