import React, { useState, useEffect } from 'react';
import { db, ref, get, child } from '../firebase';
import SessionReport from './SessionReport';

const PreviousLabs = ({ user, onBack, onViewSession }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const snapshot = await get(child(ref(db), 'sessions'));
      if (snapshot.exists()) {
        const allSessions = Object.values(snapshot.val());
        const facultySessions = allSessions
          .filter(s => s.facultyId === user.id && s.status === 'ended')
          .sort((a, b) => b.createdAt - a.createdAt);
        setSessions(facultySessions);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
    setLoading(false);
  };

  const getSessionStats = (session) => {
    const seats = session.seats || {};
    const seatsList = Object.values(seats);
    const total = seatsList.filter(s => s.studentId).length;
    const submitted = seatsList.filter(s => s.status === 'submitted').length;
    const totalMarks = seatsList.reduce((sum, s) => sum + (s.marks || 0), 0);
    const avgMarks = total > 0 ? (totalMarks / total).toFixed(1) : 0;
    return { total, submitted, avgMarks };
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '800px' }}>
      {selectedSession ? (
        <SessionReport 
          session={selectedSession}
          onBack={() => setSelectedSession(null)}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Completed Lab Sessions</h2>
            <button className="btn btn-outline" onClick={onBack}>← Back</button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No completed lab sessions found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sessions.map(session => {
                const stats = getSessionStats(session);
                return (
                  <div 
                    key={session.sessionId}
                    className="card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem' }}>{session.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                          {session.subject} • {session.labId} • Year {session.year} • Division {session.division}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                          {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          background: 'var(--text-secondary)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          marginBottom: '0.5rem'
                        }}>
                          COMPLETED
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                          {stats.total} students
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                          Avg: {stats.avgMarks}/100
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.9rem' }}>
                        View Report →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PreviousLabs;
