import { useState, useEffect } from 'react';
import { useStore } from './store';
import * as api from './api';
import MediaLibrary from './components/MediaLibrary';
import BatchManager from './components/BatchManager';
import PostManager from './components/PostManager';
import CalendarView from './components/CalendarView';
import ConfigPanel from './components/ConfigPanel';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const { currentView, setAccounts, setPlatforms } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [accountsRes, platformsRes] = await Promise.all([
        api.getAccounts(),
        api.getPlatforms(),
      ]);
      setAccounts(accountsRes.data);
      setPlatforms(platformsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        {currentView === 'media' && <MediaLibrary />}
        {currentView === 'batches' && <BatchManager />}
        {currentView === 'posts' && <PostManager />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'config' && <ConfigPanel />}
      </main>
    </div>
  );
}

export default App;
