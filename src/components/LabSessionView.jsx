import React, { useState, useEffect } from 'react';
import { subscribeToSession } from '../firebase';
import Lab123 from './Lab123';
import Lab4567 from './Lab4567';
import HPC from './HPC';
import EndLabForm from './EndLabForm';

const LabSessionView = ({ session, onBack, onEndSession }) => {
  const [liveSession, setLiveSession] = useState(session);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showEndForm, setShowEndForm] = useState(false);

  // Safety check
  if (!session || !session.sessionId) {
    return (
      <div className="card fade-in" style={{ width: '100%', maxWidth: '800px' }}>
        <p style={{ color: 'var(--error)' }}>Error: Invalid session data</p>
        <button className="btn btn-outline" onClick={onBack} style={{ width: '100%' }}>
          ← Back
        </button>
      </div>
    );
  }

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSession(session.sessionId, (data) => {
      if (data) setLiveSession(data);
    });
    return () => unsubscribe();
  }, [session.sessionId]);

  const seats = liveSession.seats || {};
  
  // Calculate stats
  const seatsList = Object.values(seats);
  const occupiedCount = seatsList.filter(s => s.status === 'occupied').length;
  const submittedCount = seatsList.filter(s => s.status === 'submitted').length;
  const totalStudents = occupiedCount + submittedCount;

  const handleEndSession = () => {
    setShowEndForm(true);
  };

  const handleSeatClick = (seatNumber) => {
    const seatData = seats[seatNumber];
    if (seatData && seatData.studentId) {
      setSelectedSeat({ number: seatNumber, ...seatData });
    }
  };

  const renderLabLayout = () => {
    const props = {
      seats,
      onSeatClick: handleSeatClick,
      sessionMode: true
    };

    if (!liveSession.labId) {
      return <div>Loading lab layout...</div>;
    }

    switch (liveSession.labId) {
      case 'lab123': return <Lab123 {...props} />;
      case 'lab456': return <Lab4567 {...props} />;
      case 'hpc': return <HPC {...props} />;
      default: return <div>Unknown lab: {liveSession.labId}</div>;
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>{liveSession?.title || 'Lab Session'}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            {liveSession?.subject || 'Unknown'} • Session ID: {session?.sessionId?.slice(-6) || 'N/A'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={onBack}>← Dashboard</button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowEndForm(true)}
            style={{ background: 'var(--error)' }}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--seat-occupied)' }}>{occupiedCount}</div>
          <div className="stat-label">Working</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--seat-submitted)' }}>{submittedCount}</div>
          <div className="stat-label">Submitted</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{liveSession?.assignmentCount || 0}</div>
          <div className="stat-label">Assignments</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        marginBottom: '1.5rem',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 20, height: 20, background: 'var(--seat-empty)', borderRadius: 4, border: '1px solid #444' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Empty</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 20, height: 20, background: 'var(--seat-occupied)', borderRadius: 4 }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Occupied</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 20, height: 20, background: 'var(--seat-submitted)', borderRadius: 4 }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Submitted</span>
        </div>
      </div>

      {/* Lab Layout */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {renderLabLayout()}
      </div>

      {/* Selected Seat Panel */}
      {selectedSeat && (
        <div className="card" style={{ 
          position: 'fixed', 
          bottom: '1rem', 
          right: '1rem', 
          width: '350px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-header" style={{ margin: 0 }}>Seat #{selectedSeat.number}</div>
            <button 
              onClick={() => setSelectedSeat(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              ×
            </button>
          </div>
          <p><strong>Student:</strong> {selectedSeat.studentName}</p>
          <p><strong>SAP ID:</strong> {selectedSeat.studentId}</p>
          <p><strong>Status:</strong> 
            <span style={{ 
              color: selectedSeat.status === 'submitted' ? 'var(--success)' : 'var(--warning)',
              marginLeft: '0.5rem'
            }}>
              {selectedSeat.status.toUpperCase()}
            </span>
          </p>
          {selectedSeat.submissions && Object.keys(selectedSeat.submissions).length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Submissions:</strong>
              {Object.values(selectedSeat.submissions).map((sub, idx) => (
                <div key={idx} style={{ 
                  background: 'var(--bg-dark)', 
                  padding: '0.5rem', 
                  borderRadius: 4, 
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{sub.fileName}</span>
                  <a 
                    href={sub.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--maroon-light)' }}
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* End Session Form */}
      {showEndForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <EndLabForm 
            session={liveSession}
            onBack={() => setShowEndForm(false)}
            onConfirm={() => {
              setShowEndForm(false);
              onEndSession();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LabSessionView;
