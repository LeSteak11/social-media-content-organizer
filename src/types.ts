export interface Account {
  id: number;
  name: string;
  type: 'fitness' | 'personal';
  description: string | null;
  created_at: string;
}

export interface Platform {
  id: number;
  name: string;
  display_name: string;
  color: string | null;
  created_at: string;
}

export interface MediaAsset {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  hash: string;
  perceptual_hash: string | null;
  imported_at: string;
  notes: string | null;
}

export interface Batch {
  id: number;
  name: string;
  description: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface ConflictWarning {
  type: 'time_conflict' | 'media_reuse' | 'cross_account_same_day' | 'batch_reuse';
  severity: 'warning' | 'error';
  message: string;
  conflictingPosts?: any[];
  details?: any;
}

export interface Config {
  timezone: string;
  warn_same_day_cross_account: string;
  min_days_before_reuse: string;
  allow_threads_ig_same_day: string;
  warn_time_conflicts: string;
}
