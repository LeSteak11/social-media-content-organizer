import { useState, useEffect } from 'react';
import { useStore } from '../store';
import * as api from '../api';
import { Plus, AlertTriangle, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import './PostManager.css';

export default function PostManager() {
  const { posts, accounts, platforms, selectedMedia, selectedBatches, clearSelections, createPostFromBatch, setCreatePostFromBatch } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Form state
  const [accountId, setAccountId] = useState<number>(0);
  const [platformId, setPlatformId] = useState<number>(0);
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'posted' | 'archived'>('scheduled'); // Default to scheduled
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  // Helper function to get next 30-minute increment
  const getNext30MinIncrement = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    // Format as datetime-local input value
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  useEffect(() => {
    loadPosts();
    
    // Load last used account/platform from localStorage
    const lastAccountId = localStorage.getItem('lastAccountId');
    const lastPlatformId = localStorage.getItem('lastPlatformId');
    
    if (lastAccountId) setAccountId(parseInt(lastAccountId, 10));
    if (lastPlatformId) setPlatformId(parseInt(lastPlatformId, 10));
  }, []);

  useEffect(() => {
    // Set defaults if not already set
    if (accounts.length > 0 && accountId === 0) {
      const lastAccountId = localStorage.getItem('lastAccountId');
      setAccountId(lastAccountId ? parseInt(lastAccountId, 10) : accounts[0].id);
    }
    if (platforms.length > 0 && platformId === 0) {
      const lastPlatformId = localStorage.getItem('lastPlatformId');
      setPlatformId(lastPlatformId ? parseInt(lastPlatformId, 10) : platforms[0].id);
    }
  }, [accounts, platforms]);

  // Watch for batch-to-post trigger
  useEffect(() => {
    if (createPostFromBatch !== null) {
      // Open create modal automatically
      openCreateModal();
      // Clear the trigger
      setCreatePostFromBatch(null);
    }
  }, [createPostFromBatch]);

  const loadPosts = async () => {
    try {
      const res = await api.getPosts();
      useStore.setState({ posts: res.data });
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const checkForConflicts = async () => {
    if (!scheduledAt || (selectedMedia.length === 0 && selectedBatches.length === 0)) {
      setConflicts([]);
      return;
    }

    try {
      const res = await api.checkConflicts({
        accountId,
        platformId,
        scheduledAt,
        mediaIds: selectedMedia.length > 0 ? selectedMedia : undefined,
        batchIds: selectedBatches.length > 0 ? selectedBatches : undefined,
      });
      setConflicts(res.data);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  useEffect(() => {
    checkForConflicts();
  }, [scheduledAt, selectedMedia, selectedBatches, accountId, platformId]);

  const handleCreatePost = async () => {
    if (!accountId || !platformId) {
      alert('Please select account and platform');
      return;
    }

    if (selectedMedia.length === 0 && selectedBatches.length === 0) {
      alert('Please select media or batches');
      return;
    }

    try {
      // Save last used account/platform
      localStorage.setItem('lastAccountId', accountId.toString());
      localStorage.setItem('lastPlatformId', platformId.toString());

      await api.createPost({
        accountId,
        platformId,
        status,
        caption: caption || undefined,
        scheduledAt: scheduledAt || undefined,
        notes: notes || undefined,
        mediaIds: selectedMedia.length > 0 ? selectedMedia : undefined,
        batchIds: selectedBatches.length > 0 ? selectedBatches : undefined,
      });

      // Clear form but keep account/platform/status for rapid creation
      setCaption('');
      setScheduledAt(getNext30MinIncrement()); // Reset to next increment
      setNotes('');
      setConflicts([]);
      clearSelections();
      
      await loadPosts();
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.textContent = '✓ Post created successfully!';
      successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 12px 24px; border-radius: 4px; z-index: 10000; font-size: 14px;';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
      
      // Keep modal open for rapid multi-post creation
      // User can close manually when done
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return;

    try {
      await api.deletePost(id);
      await loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const resetForm = () => {
    setCaption('');
    setScheduledAt(getNext30MinIncrement()); // Set to next 30-min increment
    setNotes('');
    setStatus('scheduled'); // Keep default as scheduled
    setConflicts([]);
    clearSelections();
    // Keep accountId and platformId (remembered from last use)
  };

  const openCreateModal = () => {
    resetForm();
    setEditingPost(null);
    setShowCreateModal(true);
  };

  const filteredPosts = posts.filter((post: any) =>
    filterStatus === 'all' || post.status === filterStatus
  );

  const statusOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'posted', label: 'Posted' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div className="post-manager">
      <div className="post-header">
        <h2>Posts</h2>
        <div className="post-header-actions">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={selectedMedia.length === 0 && selectedBatches.length === 0}
          >
            <Plus size={16} />
            Create Post
          </button>
        </div>
      </div>

      <div className="post-list">
        {filteredPosts.map((post: any) => (
          <div key={post.id} className="post-card card">
            <div className="post-card-header">
              <div className="post-meta">
                <span className={`badge badge-${post.status}`}>{post.status}</span>
                <span className="post-account">{post.account_name}</span>
                <span className="post-platform">{post.platform_name}</span>
              </div>
              <div className="post-card-actions">
                <button
                  className="icon-btn"
                  onClick={() => {/* TODO: Edit */}}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => handleDeletePost(post.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {post.caption && (
              <p className="post-caption">{post.caption}</p>
            )}

            {post.scheduled_at && (
              <div className="post-schedule">
                <CalendarIcon size={14} />
                <span>
                  {new Date(post.scheduled_at).toLocaleString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {post.media && post.media.length > 0 && (
              <div className="post-media-preview">
                {post.media.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="post-media-thumb">
                    {item.mime_type?.startsWith('image/') ? (
                      <img src={`/uploads/${item.file_name}`} alt="" />
                    ) : (
                      <div className="video-placeholder">VIDEO</div>
                    )}
                  </div>
                ))}
                {post.media.length > 4 && (
                  <div className="post-media-count">+{post.media.length - 4}</div>
                )}
              </div>
            )}

            {post.batches && post.batches.length > 0 && (
              <div className="post-batches">
                {post.batches.map((batch: any) => (
                  <span key={batch.id} className="batch-badge">{batch.name}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="empty-state">
          <Plus size={48} />
          <p>No posts yet. Select media/batches and create a post.</p>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Post</h3>

            <div className="form-group">
              <label>Account *</label>
              <select value={accountId} onChange={(e) => setAccountId(Number(e.target.value))}>
                {accounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Platform *</label>
              <select value={platformId} onChange={(e) => setPlatformId(Number(e.target.value))}>
                {platforms.map((plat: any) => (
                  <option key={plat.id} value={plat.id}>{plat.display_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="posted">Posted</option>
              </select>
            </div>

            <div className="form-group">
              <label>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Scheduled Date/Time (PT)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <p className="help-text">
                {selectedMedia.length > 0 && `${selectedMedia.length} media item(s) selected`}
                {selectedMedia.length > 0 && selectedBatches.length > 0 && ' • '}
                {selectedBatches.length > 0 && `${selectedBatches.length} batch(es) selected`}
              </p>
            </div>

            {conflicts.length > 0 && (
              <div className="conflicts-section">
                <h4>
                  <AlertTriangle size={16} />
                  Scheduling Conflict
                </h4>
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="warning-box">
                    <p>{conflict.message}</p>
                    {conflict.conflictingPosts && conflict.conflictingPosts.length > 0 && (
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {conflict.conflictingPosts.map((post: any) => (
                          <li key={post.id}>
                            {post.account_name} - {post.platform_name}: {post.caption?.substring(0, 30) || 'No caption'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreatePost}>
                Create Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
