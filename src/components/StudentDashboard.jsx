import React, { useState, useEffect } from 'react';
import { getAllActiveSessions } from '../firebase';

const StudentDashboard = ({ user, onJoinSession, onEditProfile }) => {
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    // Auto-filter sessions based on student's profile
    if (!loading) {
      // Sessions filtered by student's year, division and semester
      const filtered = filteredSessions.filter(session => {
        const yearMatch = session.year === parseInt(user.year);
        const divisionMatch = session.division === user.division;
        const semesterMatch = session.semester === parseInt(user.semester);
        return yearMatch && divisionMatch && semesterMatch;
      });
      setFilteredSessions(filtered);
    }
  }, []);

  const loadSessions = async () => {
    try {
      const activeSessions = await getAllActiveSessions();
      // Auto-filter by student's year, division and semester
      const filtered = activeSessions.filter(session => {
        const yearMatch = session.year === parseInt(user.year);
        const divisionMatch = session.division === user.division;
        const semesterMatch = session.semester === parseInt(user.semester);
        return yearMatch && divisionMatch && semesterMatch;
      });
      setFilteredSessions(filtered);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '700px' }}>
      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>Welcome, {user.name}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
              SAP ID: {user.sapId} • {user.course} • Year {user.year} • Sem {user.semester} • Div {user.division}
            </p>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={onEditProfile}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Active Lab Sessions</div>
        
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading sessions...</p>
        ) : filteredSessions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No active lab sessions available for your year and division.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredSessions.map(session => (
              <div 
                key={session.sessionId}
                className="session-item"
                onClick={() => onJoinSession(session)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{session.title}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>
                  <span>{session.subject}</span>
                  <span>
                    {session.labId.startsWith('lab') 
                      ? `Lab ${session.labId.replace('lab', '')}` 
                      : session.labId === 'hpc' ? 'HPC Lab' : session.labId}
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    Join Session →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          className="btn btn-outline" 
          onClick={loadSessions}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          Refresh Sessions
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;
