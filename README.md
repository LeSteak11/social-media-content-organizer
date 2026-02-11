# Social Media Content Organizer

A local-first desktop app for managing social media content across multiple accounts and platforms. Built for tracking posts, avoiding duplicates, and preventing scheduling conflicts.

## Overview

This app helps manage two social media personas (Fitness and Personal accounts) across multiple platforms (Instagram, Threads, TikTok, LinkedIn, Website). It provides:

- **Media Library**: Import, organize, and track photo/video assets with automatic duplicate detection
- **Batch Management**: Group media into "batches" (e.g., one photoshoot/outfit)
- **Post Scheduler**: Plan and schedule posts with caption management and status tracking
- **Conflict Detection**: Automatic warnings for time conflicts, media reuse, and cross-account posting
- **Calendar View**: Visual timeline of scheduled and posted content
- **Search & Filter**: Find media, batches, and posts quickly
- **Data Export**: JSON export for backup and portability

## Features

### Media Management
- Drag & drop file import
- Automatic duplicate detection (SHA-256 hash + perceptual hash for images)
- Support for images and videos
- Track where each asset has been used

### Batch System
- Group related media together (e.g., one outfit/photoshoot)
- Tag and describe batches
- Track batch usage across posts
- Create "dumps" by combining multiple batches

### Post Tracking
- Multi-account, multi-platform support
- Status tracking: Draft → Scheduled → Posted → Archived
- Caption versioning
- Scheduled date/time with timezone support
- Internal notes and metadata

### Conflict Detection
Configurable warnings for:
- **Time conflicts**: Posts scheduled within 30 minutes
- **Media reuse**: Same asset used within X days
- **Batch reuse**: Same batch used within X days
- **Cross-account conflicts**: Same media on both accounts same day
- **Platform-specific rules**: e.g., allow Threads + IG same day

### Calendar View
- Month view with all scheduled/posted content
- Color-coded by status
- Quick overview of posting schedule

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (local file-based)
- **File Storage**: Local filesystem with hash-based deduplication
- **Styling**: Custom CSS with dark theme

## Installation

### Prerequisites
- Node.js 18+ and npm
- Windows, macOS, or Linux

### Setup

1. **Clone the repository**
   ```bash
   cd social-media-content-organizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create required directories**
   ```bash
   mkdir data uploads uploads/temp
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on `http://localhost:3001`
   - Frontend dev server on `http://localhost:3000`

5. **Open in browser**
   Navigate to `http://localhost:3000`

## Usage

### First Time Setup

1. **Import Media**
   - Go to Media Library
   - Click "Upload Media" or drag & drop files
   - System automatically detects duplicates

2. **Create Batches**
   - Select media items (click to multi-select)
   - Click "Create Batch from Selected"
   - Name and tag the batch

3. **Create Posts**
   - Select media or batches
   - Click "Create Post"
   - Choose account, platform, status
   - Add caption and schedule time
   - Review conflict warnings
   - Save post

4. **View Calendar**
   - Switch to Calendar view
   - See all scheduled/posted content
   - Navigate by month

### Workflow Example

**Scenario**: Posting a gym outfit photoshoot

1. Import 5 photos from your phone
2. Create a batch named "Purple gym set - mirror selfies"
3. Create a Threads post with 2 photos for tomorrow at 9 AM
4. Create an IG post with all 5 photos as a dump for tomorrow at 6 PM
5. System warns if there's a conflict with existing posts
6. Review calendar to see full schedule

### Configuration

Go to Settings to configure:

- **Timezone**: Default is America/Los_Angeles (PT)
- **Time conflict warnings**: Alert when posts are too close together
- **Cross-account warnings**: Alert when same media appears on both accounts same day
- **Minimum reuse days**: How long to wait before reusing media/batch
- **Platform rules**: e.g., allow Threads + IG same day

### Data Export

Click "Export Data" in Settings to download a JSON file containing:
- All accounts and platforms
- All media metadata (not the files themselves)
- All batches
- All posts
- Configuration

This is useful for:
- Backups
- Moving to another machine
- Data analysis

## Project Structure

```
social-media-content-organizer/
├── server/                   # Backend API
│   ├── db/
│   │   └── database.ts      # SQLite schema and initialization
│   ├── services/
│   │   ├── mediaService.ts  # Media import and duplicate detection
│   │   ├── batchService.ts  # Batch CRUD operations
│   │   ├── postService.ts   # Post management
│   │   └── conflictService.ts # Conflict detection logic
│   ├── utils/
│   │   └── media.ts         # File hashing utilities
│   └── index.ts             # Express server
├── src/                     # Frontend React app
│   ├── components/
│   │   ├── Navigation.tsx
│   │   ├── MediaLibrary.tsx
│   │   ├── BatchManager.tsx
│   │   ├── PostManager.tsx
│   │   ├── CalendarView.tsx
│   │   └── ConfigPanel.tsx
│   ├── api.ts               # API client
│   ├── store.ts             # Zustand state management
│   ├── App.tsx
│   └── main.tsx
├── data/                    # SQLite database (created on first run)
│   └── content.db
├── uploads/                 # Imported media files
├── package.json
└── README.md
```

## Database Schema

### Tables

- **accounts**: Fitness and Personal accounts
- **platforms**: Instagram, Threads, TikTok, LinkedIn, Website
- **media_assets**: Imported photos/videos with hashes
- **batches**: Groups of related media
- **batch_media**: Many-to-many: batches ↔ media
- **posts**: Scheduled/posted content
- **post_media**: Many-to-many: posts ↔ media
- **post_batches**: Many-to-many: posts ↔ batches
- **caption_history**: Version history for captions
- **config**: App configuration/rules

### Key Indices

- Hash indices for fast duplicate detection
- Date indices for calendar queries
- Relationship indices for usage tracking

## API Endpoints

### Media
- `POST /api/media/import` - Import media files
- `GET /api/media` - List all media
- `GET /api/media/:id` - Get media details
- `GET /api/media/:id/usage` - Find where media is used
- `DELETE /api/media/:id` - Delete media

### Batches
- `POST /api/batches` - Create batch
- `GET /api/batches` - List all batches
- `GET /api/batches/:id` - Get batch with media
- `PATCH /api/batches/:id` - Update batch
- `POST /api/batches/:id/media` - Add media to batch
- `DELETE /api/batches/:id` - Delete batch

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - List all posts (with filters)
- `GET /api/posts/:id` - Get post details
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Conflicts
- `POST /api/conflicts/check` - Check for conflicts

### Config
- `GET /api/config` - Get all config
- `PATCH /api/config/:key` - Update config value

### Export
- `GET /api/export` - Export all data as JSON

## Development

### Running in Development

```bash
npm run dev
```

This runs both backend and frontend with hot reload.

### Building for Production

```bash
npm run build
```

Outputs to `dist/` directory.

### Scripts

- `npm run dev` - Start dev servers (backend + frontend)
- `npm run dev:server` - Start backend only
- `npm run dev:client` - Start frontend only
- `npm run build` - Build for production

## Configuration

### Default Accounts

- **Fitness**: Credible fitness account (Instagram, Threads, LinkedIn, Website)
- **Personal**: Personal/spam account (Instagram, Threads, TikTok)

### Default Platforms

- Instagram
- Threads
- TikTok
- LinkedIn
- Website

You can extend these by directly modifying the database.

### Rules (Configurable in UI)

- `timezone`: America/Los_Angeles
- `warn_same_day_cross_account`: true
- `min_days_before_reuse`: 7
- `allow_threads_ig_same_day`: true
- `warn_time_conflicts`: true

## Tips & Best Practices

1. **Import regularly**: Don't let media pile up on your phone
2. **Name batches clearly**: Use descriptive names like "Black dress mirror set"
3. **Use tags**: Makes batches easier to find later
4. **Review calendar weekly**: Plan ahead and avoid conflicts
5. **Check conflict warnings**: They exist to save you from mistakes
6. **Export data periodically**: Keep backups
7. **Use notes field**: Track performance, engagement, or other metadata

## Troubleshooting

### Port already in use
If ports 3000 or 3001 are in use, modify `vite.config.ts` and `server/index.ts`.

### Database locked
SQLite uses WAL mode for concurrent access. If you get "database locked" errors, close other connections.

### Media not loading
- Check that `uploads/` directory exists
- Verify file paths in database match actual files
- Check browser console for 404 errors

### Duplicate detection not working
- Perceptual hashing requires `image-hash` package
- Works best for images; videos use file hash only
- Resized/compressed images may still be detected as similar

## Future Enhancements

Potential improvements (not currently implemented):

- Direct API integration for auto-posting
- Browser extension for quick saves
- Mobile companion app
- AI-powered caption suggestions
- Analytics and performance tracking
- Multi-user support with sync
- Cloud backup integration

## License

This is a personal project. Use as you see fit.

## Support

Since this is a local-first app, all data stays on your machine. No external services, no tracking, no cloud dependencies.

For questions or issues, check the code or modify as needed. You have full control.
