# Installation & Testing Guide

## Prerequisites Check

Before you begin, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ ~100MB free disk space

## Step-by-Step Installation

### 1. Navigate to Project Directory
```powershell
cd c:\Users\jakeb\Desktop\coding-vault\social-media-content-organizer
```

### 2. Install Dependencies
```powershell
npm install
```

**Expected output**: Installation of ~50 packages including:
- express, better-sqlite3 (backend)
- react, react-dom, vite (frontend)
- axios, zustand (utilities)

**Time**: ~2-3 minutes depending on internet speed

### 3. Run Setup Script
```powershell
npm run setup
```

**This creates**:
- `data/` directory (for SQLite database)
- `uploads/` directory (for media files)
- `uploads/temp/` directory (for temporary uploads)

### 4. Start Development Server
```powershell
npm run dev
```

**Expected output**:
```
Backend: Server running on http://localhost:3001
Backend: Database initialized at: c:\...\data\content.db
Frontend: VITE ready in X ms
Frontend: Local: http://localhost:3000
```

### 5. Open Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## Testing the Application

### Test 1: UI Loads Correctly ✅
**What to check**:
- Dark theme loads
- Sidebar with 5 menu items (Media Library, Batches, Posts, Calendar, Settings)
- "Media Library" is selected by default
- Main content area shows empty state with "Upload Media" button

**Expected**: Clean dark UI with no errors in browser console

---

### Test 2: Import Media ✅
**Steps**:
1. Click "Upload Media" button in Media Library
2. Select 2-3 image files from your computer
3. Wait for upload to complete

**Expected**:
- Files upload successfully
- Thumbnails appear in media grid
- No duplicate warnings (first upload)
- Files saved to `uploads/` directory

**Verify**:
- Check `uploads/` folder contains your files
- Check browser Network tab shows successful API calls

---

### Test 3: Duplicate Detection ✅
**Steps**:
1. Upload the same file again
2. Check console output

**Expected**:
- Alert: "X duplicate(s) detected"
- Console shows duplicate information
- Only one copy of file in database
- No duplicate files in `uploads/` directory

---

### Test 4: Create Batch ✅
**Steps**:
1. In Media Library, click on 2-3 media items to select them
2. Selected items show blue border and checkmark
3. Click "Create Batch from Selected" button
4. Enter name: "Test Batch 1"
5. Enter description: "Testing batch creation"
6. Enter tags: "test, demo"
7. Click "Create Batch"

**Expected**:
- Modal closes
- Selection cleared
- Navigate to "Batches" view shows new batch
- Batch card displays name, description, tags, and media count

---

### Test 5: Create Post with Conflict Detection ✅
**Steps**:
1. Select some media items in Media Library
2. Navigate to "Posts" view
3. Click "Create Post"
4. Fill in form:
   - Account: Personal
   - Platform: Instagram
   - Status: Scheduled
   - Caption: "Test post caption #test"
   - Scheduled Date/Time: Tomorrow at 3:00 PM
   - Notes: "Testing post creation"
5. Observe conflict warnings section (should be empty for first post)
6. Click "Create Post"

**Expected**:
- Post created successfully
- Modal closes
- Post appears in list with correct status badge
- Caption and metadata visible

---

### Test 6: Conflict Warnings ✅
**Steps**:
1. Try to create another post with:
   - Same media as previous post
   - Same platform
   - Scheduled time: Tomorrow at 3:15 PM (15 min after first post)

**Expected warnings**:
- ⚠️ Time conflict warning (within 30 minutes)
- ⚠️ Media reuse warning (within 7 days)
- Warnings displayed in yellow/orange boxes
- Can still create post despite warnings

---

### Test 7: Calendar View ✅
**Steps**:
1. Navigate to "Calendar" view
2. Check current month

**Expected**:
- Calendar grid shows current month
- Today's date highlighted
- Scheduled posts appear on correct dates
- Post shows platform name and time
- Can navigate to previous/next month

---

### Test 8: Configuration ✅
**Steps**:
1. Navigate to "Settings" view
2. Change timezone to "Eastern Time (ET)"
3. Toggle "Warn about time conflicts" off
4. Change "Minimum days before reusing" to 14
5. Click settings (they auto-save)

**Expected**:
- Changes persist when navigating away and back
- New conflict rules apply to future posts
- Settings stored in database

---

### Test 9: Data Export ✅
**Steps**:
1. In Settings, click "Export All Data"
2. Check Downloads folder

**Expected**:
- JSON file downloads
- Filename: `content-organizer-export-YYYY-MM-DD.json`
- File contains all data: accounts, platforms, media, batches, posts, config
- Valid JSON format

---

### Test 10: Search Functionality ✅
**Steps**:
1. Navigate to Media Library
2. Type in search box: filename or part of filename
3. Navigate to Posts view
4. Click status filter dropdown and select "Scheduled"

**Expected**:
- Media filters as you type
- Post list filters by status
- Fast, responsive filtering

---

## Verify Database

### Check SQLite Database
```powershell
# Navigate to data directory
cd data

# Check database file exists
dir content.db

# (Optional) Use SQLite CLI to inspect
sqlite3 content.db
.tables
SELECT * FROM accounts;
.exit
```

**Expected tables**:
- accounts, platforms
- media_assets, batches, batch_media
- posts, post_media, post_batches
- caption_history, config

---

## Common Issues & Solutions

### Issue: Port 3000 or 3001 already in use
**Solution**:
```powershell
# Find and kill process using port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or edit ports in:
- `vite.config.ts` (change port: 3000)
- `server/index.ts` (change PORT = 3001)

### Issue: Database locked error
**Solution**:
- Close any SQLite database browsers
- Restart the dev server
- SQLite WAL mode should prevent this

### Issue: Media not loading in browser
**Solution**:
- Check `uploads/` directory exists
- Check file permissions
- Verify browser console for 404 errors
- Check file paths in database match actual files

### Issue: npm install fails
**Solution**:
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Check Node.js version is 18+

### Issue: TypeScript errors
**Solution**:
- Errors are expected until all files are created
- Run full build: `npm run build`
- Check `tsconfig.json` is present

---

## Performance Benchmarks

**Expected performance**:
- Initial page load: < 1 second
- Media upload (10 files): 2-5 seconds
- Duplicate detection: < 500ms per file
- Calendar render: < 200ms
- Database queries: < 50ms

**Monitor**:
- Browser DevTools → Network tab
- Browser DevTools → Performance tab
- Server logs in terminal

---

## Production Deployment (Optional)

### Build for Production
```powershell
npm run build
```

Outputs to `dist/` directory.

### Serve Production Build
```powershell
npm install -g serve
serve -s dist
```

---

## Success Criteria

Your installation is successful if:

✅ Dev server starts without errors
✅ Browser loads UI at http://localhost:3000
✅ Can upload media files
✅ Can create batches
✅ Can create posts
✅ Calendar shows scheduled posts
✅ Conflict warnings appear when appropriate
✅ Settings persist across page reloads
✅ Data export downloads valid JSON
✅ No console errors in browser

---

## Next Steps After Testing

1. **Import your real media**: Start with 10-20 photos
2. **Create meaningful batches**: Group by shoot/outfit
3. **Schedule real posts**: Plan next week's content
4. **Review calendar**: Ensure no conflicts
5. **Export data**: Create first backup
6. **Customize settings**: Adjust rules to your workflow

---

## Getting Help

If you encounter issues:

1. Check browser console for errors (F12)
2. Check server terminal for errors
3. Review README.md for detailed docs
4. Inspect database with SQLite browser
5. Check file permissions on `data/` and `uploads/`

---

**Installation complete! Ready to organize your social media content.** 🎉
