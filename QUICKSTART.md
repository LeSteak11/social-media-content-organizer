# Quick Start Guide

## Installation (5 minutes)

1. **Open terminal in project directory**
   ```bash
   cd social-media-content-organizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run setup script**
   ```bash
   npm run setup
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Go to: http://localhost:3000

## First Steps

### 1. Import Your First Media (1 min)
- Click **"Media Library"** in sidebar
- Click **"Upload Media"** button
- Select photos/videos from your computer
- Wait for import to complete

### 2. Create Your First Batch (30 sec)
- In Media Library, click on media items to select them
- Click **"Create Batch from Selected"**
- Name it (e.g., "Black dress mirror set")
- Add tags if desired (e.g., "outfit, mirror, gym")
- Click **"Create Batch"**

### 3. Schedule Your First Post (1 min)
- Click **"Posts"** in sidebar
- Click **"Create Post"**
- Select:
  - Account (Fitness or Personal)
  - Platform (Instagram, Threads, etc.)
  - Status (Draft or Scheduled)
- Add caption
- Set scheduled time
- Click **"Create Post"**

### 4. View Calendar (30 sec)
- Click **"Calendar"** in sidebar
- See your scheduled posts
- Navigate months to plan ahead

## Common Workflows

### Daily Content Batch Upload
```
1. Take photos during the day
2. At night: Upload to Media Library
3. Group into batches by outfit/location
4. Schedule posts for next few days
5. Check calendar for conflicts
```

### Creating an Instagram "Dump" Post
```
1. Select multiple batches
2. Create post with all media from those batches
3. Schedule for optimal time
4. System warns if photos were used recently
```

### Cross-Account Strategy
```
1. Upload high-quality content
2. Post best shots on Fitness account (selective)
3. Use remaining shots on Personal account (higher volume)
4. System prevents same-day cross-posting (configurable)
```

## Tips

✅ **DO**:
- Import media regularly (don't let it pile up)
- Use descriptive batch names
- Check calendar weekly
- Review conflict warnings before scheduling
- Export data monthly for backup

❌ **DON'T**:
- Ignore duplicate warnings
- Schedule multiple posts at same time
- Repost same content too quickly
- Forget to check calendar view

## Keyboard Shortcuts

- Click media items to multi-select
- Shift+Click to select range (coming soon)
- Esc to close modals

## Settings to Adjust

Go to **Settings** → Configure:

1. **Timezone**: Set to your local timezone
2. **Min Days Before Reuse**: Default is 7 days
3. **Cross-Account Rules**: Enable/disable warnings
4. **Time Conflict Window**: Default is 30 minutes

## Troubleshooting

**Problem**: Can't upload media
- **Solution**: Check uploads/ directory exists, check file formats

**Problem**: Conflicts showing incorrectly
- **Solution**: Adjust settings in Settings panel

**Problem**: App won't start
- **Solution**: Check ports 3000/3001 aren't in use

## Getting Help

- Read README.md for full documentation
- Check database schema in server/db/database.ts
- Modify code as needed - it's your app!

---

**You're ready to go! Start by uploading some media.** 🚀
