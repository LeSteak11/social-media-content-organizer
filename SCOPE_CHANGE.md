# Scope Change Summary - February 11, 2026

## Decision: Remove All Duplicate Detection

### What Was Removed

**Dependencies:**
- ❌ `image-hash` - Perceptual hashing library
- ❌ `sharp` - Image processing (unless needed elsewhere)
- ❌ `@tanstack/react-query` - Not needed for simplified scope
- ❌ `react-big-calendar` - Deferred to later phase
- ❌ `react-dropzone` - Using native file input

**Database Schema:**
- ❌ `hash` column from `media_assets` table
- ❌ `perceptual_hash` column from `media_assets` table
- ❌ Indices: `idx_media_hash`, `idx_media_perceptual_hash`
- ❌ Config entries: `warn_same_day_cross_account`, `min_days_before_reuse`, `allow_threads_ig_same_day`

**Backend Code:**
- ❌ `computeFileHash()` function
- ❌ `computePerceptualHash()` function
- ❌ `hammingDistance()` function
- ❌ `areHashesSimilar()` function
- ❌ `DuplicateCheck` interface
- ❌ Duplicate detection logic in `importMedia()`
- ❌ `checkMediaReuse()` function
- ❌ `checkBatchReuse()` function
- ❌ `checkCrossAccountSameDay()` function

**Frontend Code:**
- ❌ Duplicate warning alerts in MediaLibrary
- ❌ Media reuse warnings in PostManager
- ❌ Batch reuse warnings in PostManager
- ❌ Cross-account conflict warnings in PostManager
- ❌ Config UI for reuse rules
- ❌ Advanced conflict type displays

**Features Removed:**
- ❌ Exact duplicate detection (SHA-256)
- ❌ Similar image detection (perceptual hash)
- ❌ Media reuse tracking within X days
- ❌ Batch reuse tracking within X days
- ❌ Cross-account same-day blocking
- ❌ Configurable reuse windows
- ❌ Platform-specific exception rules

### What Was Kept

**Core Features:**
- ✅ Media import (file path storage)
- ✅ Batch organization
- ✅ Post scheduling
- ✅ Account and platform management
- ✅ Caption versioning
- ✅ Status workflow (Draft/Scheduled/Posted/Archived)
- ✅ Notes and metadata
- ✅ Time-based conflict detection (exact same time only)
- ✅ Calendar view
- ✅ Basic search and filtering

**Simplified Conflict Detection:**
- ✅ Time conflicts: Warns if two posts scheduled at **exact same minute** on same platform
- ✅ Non-blocking: User can override and create post anyway
- ❌ No 30-minute window checking
- ❌ No media reuse logic
- ❌ No cross-account logic

**Configuration:**
- ✅ Timezone selection (America/Los_Angeles)
- ✅ Toggle time conflict warnings on/off
- ❌ No reuse-related settings
- ❌ No platform pair exception rules

### Simplified Data Model

```sql
-- Media Assets (simplified)
CREATE TABLE media_assets (
  id INTEGER PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  imported_at DATETIME,
  notes TEXT
);
-- No hash columns

-- Posts (unchanged)
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  account_id INTEGER,
  platform_id INTEGER,
  status TEXT CHECK(status IN ('draft', 'scheduled', 'posted', 'archived')),
  caption TEXT,
  scheduled_at DATETIME,
  posted_at DATETIME,
  external_url TEXT,
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

-- Config (simplified)
INSERT INTO config VALUES
  ('timezone', 'America/Los_Angeles'),
  ('warn_time_conflicts', 'true');
```

### Revised Philosophy

**From:** Content policing system that prevents duplicates and enforces reuse rules

**To:** Content organization and scheduling tool that helps avoid time collisions

**User Can Now:**
- Import same media multiple times (no warnings)
- Reuse media/batches immediately (no tracking)
- Post same content on both accounts same day (no restrictions)
- Only get warned if scheduling exact same time on same platform

### Why This Change?

**Reasons:**
1. **Simplicity First:** Core workflow should work cleanly before adding complexity
2. **User Control:** Let user decide what to post when, don't enforce policies
3. **Faster Development:** Skip complex hashing and similarity detection
4. **Operational Focus:** Prevent scheduling mistakes, not content mistakes
5. **Layered Approach:** Can add back advanced features later if needed

### Impact on Development

**Before Change:**
- Estimated 5 weeks to full feature set
- Complex duplicate detection testing needed
- Performance concerns with hash comparison
- User education on reuse rules required

**After Change:**
- Estimated 2-3 weeks to core features
- Straightforward time comparison testing
- Simple and fast queries
- Intuitive scheduling-focused UX

### Next Implementation Phase

**Priority 1 - Foundation (Week 1):**
1. Verify database schema working
2. Test media import flow
3. Test batch creation
4. Test post scheduling
5. Verify time conflict warnings

**Priority 2 - Core UI (Week 2):**
1. Polish media library grid
2. Batch management interface
3. Post creation form
4. Schedule list view (chronological)
5. Basic filtering

**Priority 3 - Polish (Week 3):**
1. Calendar month view
2. Search improvements
3. Export/import data
4. User documentation
5. Bug fixes

### Future Considerations

**Could Add Later (If Needed):**
- Optional duplicate detection flag on import
- Media usage history view ("Where was this used?")
- Reuse warnings as optional feature
- Advanced conflict detection rules
- Image similarity search

**But Not Required For MVP**

---

## Summary

**Scope:** Simplified from content compliance system to content scheduling tool

**Focus:** Time-based conflict prevention only

**Benefit:** Faster delivery, simpler UX, more user control

**Trade-off:** No automatic duplicate prevention (user's responsibility)

**Status:** Changes implemented, ready to continue with simplified Phase 2
