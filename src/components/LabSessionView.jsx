import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToSession, 
  sendSignal, 
  subscribeToSignals, 
  clearSignals 
} from '../firebase';
import Lab123 from './Lab123';
import Lab4567 from './Lab4567';
import HPC from './HPC';
import EndLabForm from './EndLabForm';

const RemoteVideo = ({ stream, label }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ background: 'var(--bg-dark)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #444' }}>
      <div style={{ background: '#333', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
      </div>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: 'black' }} 
      />
    </div>
  );
};

const LabSessionView = ({ session, onBack, onEndSession, user }) => {
  const [liveSession, setLiveSession] = useState(session);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showEndForm, setShowEndForm] = useState(false);
  const [viewMode, setViewMode] = useState('layout'); // 'layout' or 'grid'
  
  // WebRTC States for Single View
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const pcRef = useRef(null);
  const videoRef = useRef(null);

  // WebRTC States for Grid View
  const [gridStreams, setGridStreams] = useState({}); // { studentId: stream }
  const gridConnections = useRef({}); // { studentId: pc }

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

    // Signaling Listener
    const unsubSignals = subscribeToSignals(session.sessionId, user.id, async (signals) => {
      const now = Date.now();
      for (const fromId in signals) {
        const signalGroup = signals[fromId];
        for (const signalId in signalGroup) {
          const signal = signalGroup[signalId];

          // Ignore signals older than 10 seconds
          if (now - signal.timestamp > 10000) continue;

          // Check if it's for single view or grid view
          const pc = (viewMode === 'layout') ? pcRef.current : gridConnections.current[fromId];

          if (pc) {
            try {
              if (signal.type === 'offer') {
                await handleOffer(fromId, signal.sdp, pc);
              } else if (signal.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              }
            } catch (err) {
              console.error('Error processing faculty signal:', err);
            }
          }
        }
      }
      if (Object.keys(signals).length > 0) {
        clearSignals(session.sessionId, user.id);
      }
    });

    return () => {
      unsubscribe();
      unsubSignals();
      closeConnection();
      closeAllGridConnections();
    };
  }, [session.sessionId, viewMode]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const closeConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setIsConnecting(false);
  };

  const closeAllGridConnections = () => {
    Object.values(gridConnections.current).forEach(pc => pc.close());
    gridConnections.current = {};
    setGridStreams({});
  };

  const createPeerConnection = (studentId, isGrid = false) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(session.sessionId, studentId, user.id, {
          type: 'candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      if (isGrid) {
        setGridStreams(prev => ({ ...prev, [studentId]: event.streams[0] }));
      } else {
        setRemoteStream(event.streams[0]);
        setIsConnecting(false);
      }
    };

    return pc;
  };

  const handleViewScreen = async (studentId) => {
    closeConnection();
    setIsConnecting(true);
    pcRef.current = createPeerConnection(studentId);

    // Request connection from student
    sendSignal(session.sessionId, studentId, user.id, {
      type: 'view_request'
    });
  };

  const handleOffer = async (studentId, sdp, pc) => {
    try {
      if (pc.signalingState !== 'stable') return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal(session.sessionId, studentId, user.id, {
        type: 'answer',
        sdp: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
    } catch (err) {
      console.error('Error handling WebRTC offer:', err);
    }
  };

  const toggleGridView = () => {
    if (viewMode === 'layout') {
      closeConnection();
      setViewMode('grid');
      // Connect to all sharing students
      Object.entries(liveSession.seats || {}).forEach(([num, seat]) => {
        if (seat.isSharing && seat.studentId) {
          const pc = createPeerConnection(seat.studentId, true);
          gridConnections.current[seat.studentId] = pc;
          sendSignal(session.sessionId, seat.studentId, user.id, { type: 'view_request' });
        }
      });
    } else {
      closeAllGridConnections();
      setViewMode('layout');
    }
  };

  // Monitor grid sharing status
  useEffect(() => {
    if (viewMode === 'grid') {
      const sharingIds = new Set(
        Object.values(liveSession.seats || {})
          .filter(s => s.isSharing && s.studentId)
          .map(s => s.studentId)
      );

      // Remove connections for students who stopped sharing
      Object.keys(gridConnections.current).forEach(studentId => {
        if (!sharingIds.has(studentId)) {
          gridConnections.current[studentId].close();
          delete gridConnections.current[studentId];
          setGridStreams(prev => {
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
        }
      });

      // Add connections for students who started sharing
      Object.values(liveSession.seats || {}).forEach(seat => {
        if (seat.isSharing && seat.studentId && !gridConnections.current[seat.studentId]) {
          const pc = createPeerConnection(seat.studentId, true);
          gridConnections.current[seat.studentId] = pc;
          sendSignal(session.sessionId, seat.studentId, user.id, { type: 'view_request' });
        }
      });
    }
  }, [liveSession.seats, viewMode]);

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
      sessionMode: true,
      labId: liveSession.labId
    };

    if (!liveSession.labId) {
      return <div>Loading lab layout...</div>;
    }

    switch (liveSession.labId) {
      case 'lab1':
      case 'lab2':
      case 'lab3':
      case 'lab123': return <Lab123 {...props} />;
      case 'lab4':
      case 'lab5':
      case 'lab6':
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
          <button 
            className="btn btn-secondary" 
            onClick={toggleGridView}
            style={{ minWidth: '150px' }}
          >
            {viewMode === 'layout' ? 'View All Screens' : 'Back to Layout'}
          </button>
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

      {/* Main Content Area */}
      {viewMode === 'layout' ? (
        <>
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

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {renderLabLayout()}
          </div>
        </>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1rem' 
        }}>
          {Object.entries(gridStreams).length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                No active screen shares to display.
              </p>
              <button className="btn btn-outline" onClick={() => setViewMode('layout')} style={{ marginTop: '1rem' }}>
                Return to Lab Layout
              </button>
            </div>
          ) : (
            Object.entries(gridStreams).map(([studentId, stream]) => {
              const seat = Object.values(liveSession.seats || {}).find(s => s.studentId === studentId);
              return (
                <RemoteVideo 
                  key={studentId} 
                  stream={stream} 
                  label={seat?.studentName || studentId} 
                />
              );
            })
          )}
        </div>
      )}

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
          
          <div style={{ marginTop: '1rem' }}>
            {selectedSeat.isSharing ? (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', background: 'var(--success)' }}
                onClick={() => handleViewScreen(selectedSeat.studentId)}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'View Live Screen'}
              </button>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                Student is not sharing screen
              </p>
            )}
          </div>

          {remoteStream && (
            <div style={{ marginTop: '1rem', border: '2px solid var(--maroon)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--maroon)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>LIVE SCREEN</span>
                <span style={{ cursor: 'pointer' }} onClick={closeConnection}>CLOSE ×</span>
              </div>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', display: 'block' }} 
              />
            </div>
          )}

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
