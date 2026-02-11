import { useState, useEffect } from 'react';
import { useStore } from '../store';
import * as api from '../api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarView.css';

export default function CalendarView() {
  const { posts } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarPosts, setCalendarPosts] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
  }, [currentDate]);

  const loadPosts = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const res = await api.getPosts({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      });
      
      setCalendarPosts(res.data);
      useStore.setState({ posts: res.data });
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getPostsForDay = (date: Date) => {
    if (!date) return [];
    
    return calendarPosts.filter((post: any) => {
      const postDate = post.scheduled_at ? new Date(post.scheduled_at) : 
                      post.posted_at ? new Date(post.posted_at) : null;
      
      if (!postDate) return false;
      
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>Calendar</h2>
        <div className="calendar-controls">
          <button className="btn btn-secondary" onClick={goToToday}>
            Today
          </button>
          <button className="icon-btn" onClick={goToPreviousMonth}>
            <ChevronLeft size={20} />
          </button>
          <span className="calendar-month">{monthName}</span>
          <button className="icon-btn" onClick={goToNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="calendar-day empty" />;
            }

            const dayPosts = getPostsForDay(date);
            const isToday = 
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={date.toISOString()}
                className={`calendar-day ${isToday ? 'today' : ''}`}
              >
                <div className="calendar-day-number">{date.getDate()}</div>
                <div className="calendar-day-posts">
                  {dayPosts.map((post: any) => (
                    <div
                      key={post.id}
                      className={`calendar-post badge-${post.status}`}
                      title={`${post.platform_name} - ${post.caption?.substring(0, 50) || 'No caption'}`}
                    >
                      <span className="calendar-post-platform">{post.platform_name}</span>
                      {post.scheduled_at && (
                        <span className="calendar-post-time">
                          {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-badge badge-draft">Draft</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge badge-scheduled">Scheduled</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge badge-posted">Posted</span>
        </div>
      </div>
    </div>
  );
}
