import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/content.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7;

/**
 * Creates a backup of the SQLite database
 * Stores in /backups directory with timestamp
 * Keeps only the last 7 backups (rolling deletion)
 */
export async function createBackup(): Promise<void> {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Check if database exists before backing up
    if (!fs.existsSync(DB_PATH)) {
      console.log('[Backup] Database does not exist yet, skipping backup');
      return;
    }

    // Create timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFilename = `content-backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[Backup] Created backup: ${backupFilename}`);

    // Clean up old backups (keep only last MAX_BACKUPS)
    await cleanOldBackups();
  } catch (error) {
    console.error('[Backup] Failed to create backup:', error);
    // Don't throw - backup failure should not prevent app from starting
  }
}

/**
 * Removes old backups, keeping only the last MAX_BACKUPS files
 */
async function cleanOldBackups(): Promise<void> {
  try {
    // Get all backup files
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('content-backup-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    // Delete excess backups
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`[Backup] Deleted old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('[Backup] Failed to clean old backups:', error);
  }
}

/**
 * Lists all available backups with metadata
 */
export function listBackups(): Array<{ filename: string; date: Date; size: number }> {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }

    return fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('content-backup-') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          date: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('[Backup] Failed to list backups:', error);
    return [];
  }
}

/**
 * Restores database from a backup file
 */
export async function restoreBackup(backupFilename: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, backupFilename);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupFilename}`);
  }

  // Create a backup of current database before restoring
  await createBackup();

  // Restore from backup
  fs.copyFileSync(backupPath, DB_PATH);
  console.log(`[Backup] Restored from backup: ${backupFilename}`);
}
