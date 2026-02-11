import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import * as api from '../api';
import { Upload, Search, X, Check, AlertTriangle } from 'lucide-react';
import './MediaLibrary.css';

export default function MediaLibrary() {
  const { media, setMedia, selectedMedia, toggleMediaSelection, clearSelections } = useStore();
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const res = await api.getMedia();
      setMedia(res.data);
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const res = await api.importMedia(files);
      await loadMedia();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this media? This cannot be undone.')) return;
    
    try {
      await api.deleteMedia(id);
      await loadMedia();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const filteredMedia = media.filter((m: any) =>
    m.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="media-library">
      <div className="media-header">
        <h2>Media Library</h2>
        <div className="media-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="btn btn-primary">
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload Media'}
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {selectedMedia.length > 0 && (
        <div className="selection-bar">
          <span>{selectedMedia.length} selected</span>
          <button className="btn btn-secondary" onClick={clearSelections}>
            Clear
          </button>
        </div>
      )}

      <div className={`media-grid ${viewMode}`}>
        {filteredMedia.map((item: any) => (
          <div
            key={item.id}
            className={`media-item ${selectedMedia.includes(item.id) ? 'selected' : ''}`}
            onClick={() => toggleMediaSelection(item.id)}
          >
            {item.mime_type?.startsWith('image/') ? (
              <img
                src={`/uploads/${item.file_name}`}
                alt={item.file_name}
                className="media-thumbnail"
              />
            ) : (
              <div className="media-thumbnail video-placeholder">
                <span>VIDEO</span>
              </div>
            )}
            <div className="media-info">
              <div className="media-name">{item.file_name}</div>
              <div className="media-meta">
                {new Date(item.imported_at).toLocaleDateString()}
              </div>
            </div>
            {selectedMedia.includes(item.id) && (
              <div className="selection-indicator">
                <Check size={16} />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="empty-state">
          <Upload size={48} />
          <p>No media found. Upload some files to get started.</p>
        </div>
      )}
    </div>
  );
}
