import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db/database.js';
import * as mediaService from './services/mediaService.js';
import * as batchService from './services/batchService.js';
import * as postService from './services/postService.js';
import * as conflictService from './services/conflictService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/temp'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// Initialize database
initDatabase();

// ============= ACCOUNTS & PLATFORMS =============

app.get('/api/accounts', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts').all();
  res.json(accounts);
});

app.get('/api/platforms', (req, res) => {
  const platforms = db.prepare('SELECT * FROM platforms').all();
  res.json(platforms);
});

// ============= MEDIA =============

app.post('/api/media/import', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    for (const file of files) {
      const result = await mediaService.importMedia(file.path, true, path.join(__dirname, '../uploads'));
      results.push(result);
    }

    res.json(results);
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/media', (req, res) => {
  const media = mediaService.getAllMedia();
  res.json(media);
});

app.get('/api/media/:id', (req, res) => {
  const media = mediaService.getMediaById(parseInt(req.params.id));
  if (!media) {
    return res.status(404).json({ error: 'Media not found' });
  }
  res.json(media);
});

app.get('/api/media/:id/usage', (req, res) => {
  const usage = mediaService.findMediaUsage(parseInt(req.params.id));
  res.json(usage);
});

app.delete('/api/media/:id', (req, res) => {
  mediaService.deleteMedia(parseInt(req.params.id));
  res.json({ success: true });
});

// ============= BATCHES =============

app.post('/api/batches', (req, res) => {
  try {
    const { name, description, tags, mediaIds } = req.body;
    const batch = batchService.createBatch(name, description, tags);
    
    if (mediaIds && mediaIds.length > 0) {
      batchService.addMediaToBatch(batch.id, mediaIds);
    }
    
    res.json(batchService.getBatchById(batch.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/batches', (req, res) => {
  const batches = batchService.getAllBatches();
  res.json(batches);
});

app.get('/api/batches/:id', (req, res) => {
  const batch = batchService.getBatchById(parseInt(req.params.id));
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  res.json(batch);
});

app.patch('/api/batches/:id', (req, res) => {
  try {
    const batch = batchService.updateBatch(parseInt(req.params.id), req.body);
    res.json(batch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/batches/:id/media', (req, res) => {
  try {
    const { mediaIds } = req.body;
    batchService.addMediaToBatch(parseInt(req.params.id), mediaIds);
    res.json(batchService.getBatchById(parseInt(req.params.id)));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/batches/:id/media/:mediaId', (req, res) => {
  batchService.removeMediaFromBatch(parseInt(req.params.id), parseInt(req.params.mediaId));
  res.json({ success: true });
});

app.get('/api/batches/:id/usage', (req, res) => {
  const usage = batchService.findBatchUsage(parseInt(req.params.id));
  res.json(usage);
});

app.delete('/api/batches/:id', (req, res) => {
  batchService.deleteBatch(parseInt(req.params.id));
  res.json({ success: true });
});

// ============= POSTS =============

app.post('/api/posts', (req, res) => {
  try {
    const post = postService.createPost(req.body);
    res.json(postService.getPostById(post.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts', (req, res) => {
  const { startDate, endDate, search } = req.query;
  
  if (startDate && endDate) {
    const posts = postService.getPostsByDateRange(startDate as string, endDate as string);
    return res.json(posts);
  }
  
  if (search) {
    const posts = postService.searchPosts(search as string);
    return res.json(posts);
  }
  
  const posts = postService.getAllPosts();
  res.json(posts);
});

app.get('/api/posts/:id', (req, res) => {
  const post = postService.getPostById(parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.patch('/api/posts/:id', (req, res) => {
  try {
    const post = postService.updatePost(parseInt(req.params.id), req.body);
    res.json(postService.getPostById(post.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  postService.deletePost(parseInt(req.params.id));
  res.json({ success: true });
});

// ============= CONFLICTS =============

app.post('/api/conflicts/check', (req, res) => {
  try {
    const warnings = conflictService.checkConflicts(req.body);
    res.json(warnings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CONFIG =============

app.get('/api/config', (req, res) => {
  const config = conflictService.getAllConfig();
  res.json(config);
});

app.patch('/api/config/:key', (req, res) => {
  try {
    const { value } = req.body;
    conflictService.updateConfig(req.params.key, value);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= EXPORT/IMPORT =============

app.get('/api/export', (req, res) => {
  try {
    const data = {
      accounts: db.prepare('SELECT * FROM accounts').all(),
      platforms: db.prepare('SELECT * FROM platforms').all(),
      media: db.prepare('SELECT * FROM media_assets').all(),
      batches: db.prepare('SELECT * FROM batches').all(),
      batchMedia: db.prepare('SELECT * FROM batch_media').all(),
      posts: db.prepare('SELECT * FROM posts').all(),
      postMedia: db.prepare('SELECT * FROM post_media').all(),
      postBatches: db.prepare('SELECT * FROM post_batches').all(),
      config: db.prepare('SELECT * FROM config').all(),
      exportedAt: new Date().toISOString(),
    };
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    // TODO: Implement import logic with proper transaction handling
    res.json({ success: true, message: 'Import not yet implemented' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
