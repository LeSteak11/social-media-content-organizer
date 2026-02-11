import { useState, useEffect } from 'react';
import * as api from '../api';
import { Save, Download } from 'lucide-react';
import './ConfigPanel.css';

export default function ConfigPanel() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.getConfig();
      setConfig(res.data);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      await api.updateConfig(key, value);
      setConfig({ ...config, [key]: value });
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportData();
      const dataStr = JSON.stringify(res.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `content-organizer-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Export failed');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading settings...</div>;
  }

  return (
    <div className="config-panel">
      <div className="config-header">
        <h2>Settings</h2>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} />
          Export Data
        </button>
      </div>

      <div className="config-sections">
        <section className="config-section card">
          <h3>Timezone</h3>
          <p className="section-description">
            Default timezone for scheduling posts
          </p>
          <select
            value={config.timezone || 'America/Los_Angeles'}
            onChange={(e) => handleUpdate('timezone', e.target.value)}
          >
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="UTC">UTC</option>
          </select>
        </section>

        <section className="config-section card">
          <h3>Conflict Detection</h3>
          
          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.warn_time_conflicts === 'true'}
                onChange={(e) => handleUpdate('warn_time_conflicts', e.target.checked ? 'true' : 'false')}
              />
              <span>Warn about time conflicts</span>
            </label>
            <p className="help-text">
              Show warning when posts are scheduled within 30 minutes of each other
            </p>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.warn_same_day_cross_account === 'true'}
                onChange={(e) => handleUpdate('warn_same_day_cross_account', e.target.checked ? 'true' : 'false')}
              />
              <span>Warn about cross-account same-day posts</span>
            </label>
            <p className="help-text">
              Show warning when same media appears on both accounts on the same day
            </p>
          </div>

          <div className="config-item">
            <label>
              <input
                type="checkbox"
                checked={config.allow_threads_ig_same_day === 'true'}
                onChange={(e) => handleUpdate('allow_threads_ig_same_day', e.target.checked ? 'true' : 'false')}
              />
              <span>Allow Threads + Instagram same day</span>
            </label>
            <p className="help-text">
              Allow same batch to be posted on Threads and Instagram on the same day
            </p>
          </div>

          <div className="config-item">
            <label htmlFor="min-days">
              <span>Minimum days before reusing media/batch</span>
            </label>
            <input
              id="min-days"
              type="number"
              min="0"
              max="365"
              value={config.min_days_before_reuse || '7'}
              onChange={(e) => handleUpdate('min_days_before_reuse', e.target.value)}
              className="number-input"
            />
            <p className="help-text">
              Show warning when reusing media or batch within this many days
            </p>
          </div>
        </section>

        <section className="config-section card">
          <h3>Data Management</h3>
          
          <div className="config-item">
            <p className="section-description">
              Export your entire content database as JSON for backup or transfer.
            </p>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} />
              Export All Data
            </button>
          </div>

          <div className="config-item">
            <p className="help-text">
              Database location: <code>data/content.db</code><br />
              Uploaded media: <code>uploads/</code>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
