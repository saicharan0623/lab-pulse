import React, { useState, useEffect } from 'react';
import { getFacultyStats, getAllActiveSessions } from '../firebase';

const FacultyDashboard = ({ user, onStartLab, onPreviousLabs, onSemesterReport, onViewSession }) => {
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, sessions] = await Promise.all([
        getFacultyStats(user.id),
        getAllActiveSessions()
      ]);
      setStats(statsData);
      setActiveSessions(sessions.filter(s => s.facultyId === user.id));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '900px' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
        Welcome, {user.name || 'Faculty'}
      </h2>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Labs Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Labs</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={onStartLab}
          style={{ padding: '2rem', fontSize: '1.25rem' }}
        >
          🚀 Start New Lab
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onPreviousLabs}
          style={{ padding: '2rem', fontSize: '1.25rem' }}
        >
          📋 Previous Labs
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onSemesterReport}
          style={{ padding: '2rem', fontSize: '1.25rem' }}
        >
          📊 Semester Report
        </button>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="card">
          <div className="card-header">Active Lab Sessions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeSessions.map(session => (
              <div 
                key={session.sessionId}
                className="session-item active"
                onClick={() => onViewSession(session)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{session.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {session.subject} • {session.labId}
                    </div>
                  </div>
                  <div style={{ 
                    background: 'var(--success)', 
                    color: 'white', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px',
                    fontSize: '0.8rem'
                  }}>
                    LIVE
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
