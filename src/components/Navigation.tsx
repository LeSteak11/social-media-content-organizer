import { useStore } from '../store';
import { Image, Grid3X3, FileText, Calendar, Settings } from 'lucide-react';

export default function Navigation() {
  const { currentView, setCurrentView } = useStore();

  const navItems = [
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'batches', label: 'Batches', icon: Grid3X3 },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'config', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav>
      <div className="nav-header">
        <h1>Content Organizer</h1>
        <p>Kayleigh Gomez</p>
      </div>
      <div className="nav-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id as any)}
            >
              <Icon className="nav-icon" size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
