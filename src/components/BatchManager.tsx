import { useState, useEffect } from 'react';
import { useStore } from '../store';
import * as api from '../api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import './BatchManager.css';

export default function BatchManager() {
  const { batches, setBatches, media, selectedMedia, clearSelections } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [batchTags, setBatchTags] = useState('');

  useEffect(() => {
    loadBatches();
    loadMedia();
  }, []);

  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      setBatches(res.data);
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  const loadMedia = async () => {
    try {
      const res = await api.getMedia();
      useStore.setState({ media: res.data });
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  };

  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      alert('Please enter a batch name');
      return;
    }

    if (selectedMedia.length === 0) {
      alert('Please select at least one media item');
      return;
    }

    try {
      const tags = batchTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.createBatch({
        name: batchName,
        description: batchDescription || undefined,
        tags: tags.length > 0 ? tags : undefined,
        mediaIds: selectedMedia,
      });

      setBatchName('');
      setBatchDescription('');
      setBatchTags('');
      setShowCreateModal(false);
      clearSelections();
      await loadBatches();
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert('Failed to create batch');
    }
  };

  const handleDeleteBatch = async (id: number) => {
    if (!confirm('Delete this batch? Media will not be deleted.')) return;

    try {
      await api.deleteBatch(id);
      await loadBatches();
    } catch (error) {
      console.error('Failed to delete batch:', error);
    }
  };

  const viewBatchDetails = async (id: number) => {
    try {
      const res = await api.getBatchById(id);
      setSelectedBatch(res.data);
    } catch (error) {
      console.error('Failed to load batch details:', error);
    }
  };

  return (
    <div className="batch-manager">
      <div className="batch-header">
        <h2>Batches</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={selectedMedia.length === 0}
        >
          <Plus size={16} />
          Create Batch from Selected ({selectedMedia.length})
        </button>
      </div>

      <div className="batch-grid">
        {batches.map((batch: any) => (
          <div key={batch.id} className="batch-card card">
            <div className="batch-card-header">
              <h3>{batch.name}</h3>
              <div className="batch-card-actions">
                <button
                  className="icon-btn"
                  onClick={() => viewBatchDetails(batch.id)}
                  title="View details"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => handleDeleteBatch(batch.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {batch.description && (
              <p className="batch-description">{batch.description}</p>
            )}
            {batch.tags && (
              <div className="batch-tags">
                {batch.tags.split(',').map((tag: string) => (
                  <span key={tag} className="tag">{tag.trim()}</span>
                ))}
              </div>
            )}
            <div className="batch-stats">
              <span>{batch.media_count || 0} media items</span>
              <span>{new Date(batch.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {batches.length === 0 && (
        <div className="empty-state">
          <Plus size={48} />
          <p>No batches yet. Select media and create a batch.</p>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Batch</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Black dress mirror set"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={batchDescription}
                onChange={(e) => setBatchDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={batchTags}
                onChange={(e) => setBatchTags(e.target.value)}
                placeholder="e.g., outfit, mirror, black dress"
              />
            </div>
            <div className="form-group">
              <p className="help-text">
                {selectedMedia.length} media item(s) will be added to this batch
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateBatch}>
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBatch && (
        <div className="modal-overlay" onClick={() => setSelectedBatch(null)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedBatch.name}</h3>
            {selectedBatch.description && (
              <p className="batch-description">{selectedBatch.description}</p>
            )}
            <div className="batch-media-grid">
              {selectedBatch.media?.map((item: any) => (
                <div key={item.id} className="batch-media-item">
                  {item.mime_type?.startsWith('image/') ? (
                    <img
                      src={`/uploads/${item.file_name}`}
                      alt={item.file_name}
                    />
                  ) : (
                    <div className="video-placeholder">VIDEO</div>
                  )}
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedBatch(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
