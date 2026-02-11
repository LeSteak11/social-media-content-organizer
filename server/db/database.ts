import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/content.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
export function initDatabase() {
  db.exec(`
    -- Accounts table
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('fitness', 'personal')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Platforms table
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Media Assets table
    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      width INTEGER,
      height INTEGER,
      imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    -- Batches (photo sets/shoots)
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Batch media (many-to-many)
    CREATE TABLE IF NOT EXISTS batch_media (
      batch_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (batch_id, media_id),
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE CASCADE
    );

    -- Posts table
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft', 'scheduled', 'posted', 'archived')),
      caption TEXT,
      caption_version INTEGER DEFAULT 1,
      scheduled_at DATETIME,
      posted_at DATETIME,
      post_url TEXT,
      post_external_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    -- Post media (many-to-many)
    CREATE TABLE IF NOT EXISTS post_media (
      post_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (post_id, media_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE CASCADE
    );

    -- Post batches (for tracking which batches are used)
    CREATE TABLE IF NOT EXISTS post_batches (
      post_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      PRIMARY KEY (post_id, batch_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
    );

    -- Configuration/Rules table
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Caption history (versioning)
    CREATE TABLE IF NOT EXISTS caption_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(post_id, version)
    );

    -- Indices for performance
    CREATE INDEX IF NOT EXISTS idx_media_hash ON media_assets(hash);
    CREATE INDEX IF NOT EXISTS idx_media_perceptual_hash ON media_assets(perceptual_hash);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_batch_media_batch ON batch_media(batch_id);
    CREATE INDEX IF NOT EXISTS idx_batch_media_media ON batch_media(media_id);
    CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_media_media ON post_media(media_id);
  `);

  // Insert default data
  const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
  if (accountCount.count === 0) {
    db.exec(`
      INSERT INTO accounts (name, type, description) VALUES
        ('Fitness', 'fitness', 'Credible fitness account - Instagram, Threads, LinkedIn, Website'),
        ('Personal', 'personal', 'Personal/spam account - higher volume, "hot college girl" vibe');

      INSERT INTO platforms (name, display_name, color) VALUES
        ('instagram', 'Instagram', '#E4405F'),
        ('threads', 'Threads', '#000000'),
        ('tiktok', 'TikTok', '#000000'),
        ('linkedin', 'LinkedIn', '#0A66C2'),
        ('website', 'Website', '#6366F1');

      INSERT INTO config (key, value, description) VALUES
        ('timezone', 'America/Los_Angeles', 'Default timezone for scheduling'),
        ('warn_same_day_cross_account', 'true', 'Warn if same media appears on both accounts same day'),
        ('min_days_before_reuse', '7', 'Minimum days before reusing same asset/batch'),
        ('allow

  console.log('Database initialized at:', dbPath);
}

export default db;
