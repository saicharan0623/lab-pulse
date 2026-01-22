import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToSession, 
  addSubmission, 
  deleteSubmission, 
  uploadFile, 
  switchSeat, 
  subscribeToSeats,
  sendSignal,
  subscribeToSignals,
  clearSignals,
  updateSeatSharing 
} from '../firebase';

const StudentLabView = ({ session, user, seatNumber, onSwitchSeat, onLeave }) => {
  const [liveSession, setLiveSession] = useState(session);
  const [seats, setSeats] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [newSeat, setNewSeat] = useState(null);
  
  // WebRTC States
  const [isSharing, setIsSharing] = useState(false);
  const streamRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    const unsubSession = subscribeToSession(session.sessionId, (data) => {
      if (data) setLiveSession(data);
      if (data?.status === 'ended') {
        stopSharing();
        alert('Lab session has ended!');
        onLeave();
      }
    });
    
    const unsubSeats = subscribeToSeats(session.sessionId, setSeats);
    
    // Signaling Listener
    const unsubSignals = subscribeToSignals(session.sessionId, user.sapId, async (signals) => {
      for (const fromId in signals) {
        const signalGroup = signals[fromId];
        // Process signals from faculty
        for (const signalId in signalGroup) {
          const signal = signalGroup[signalId];
          if (signal.type === 'view_request') {
            await handleViewRequest(fromId);
          } else if (pcRef.current) {
            if (signal.type === 'answer') {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'candidate') {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          }
        }
      }
      // After processing, clear signals for this user to avoid re-processing
      if (Object.keys(signals).length > 0) {
        clearSignals(session.sessionId, user.sapId);
      }
    });
    
    return () => {
      unsubSession();
      unsubSeats();
      unsubSignals();
      stopSharing();
    };
  }, [session.sessionId]);

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsSharing(false);
    updateSeatSharing(session.sessionId, seatNumber, false);
  };

  const handleToggleSharing = async () => {
    if (isSharing) {
      stopSharing();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: "always" },
          audio: false 
        });
        
        streamRef.current = stream;
        setIsSharing(true);
        updateSeatSharing(session.sessionId, seatNumber, true);
        
        // Listen for track ending (user clicks "Stop sharing" in browser UI)
        stream.getVideoTracks()[0].onended = () => {
          stopSharing();
        };
      } catch (err) {
        setError('Screen share failed: ' + err.message);
      }
    }
  };

  const handleViewRequest = async (facultyId) => {
    if (!streamRef.current) return;
    
    // Close existing connection if any
    if (pcRef.current) {
      pcRef.current.close();
    }

    // Create new PeerConnection for this faculty member
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pcRef.current = pc;

    // Add screen tracks
    streamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, streamRef.current);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(session.sessionId, facultyId, user.sapId, {
          type: 'candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    try {
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      sendSignal(session.sessionId, facultyId, user.sapId, {
        type: 'offer',
        sdp: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
    }
  };

  const mySeatData = seats[seatNumber] || {};
  const mySubmissions = mySeatData.submissions ? Object.entries(mySeatData.submissions) : [];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const path = `submissions/${session.sessionId}/${user.sapId}/${Date.now()}_${file.name}`;
      const fileUrl = await uploadFile(file, path);
      
      await addSubmission(session.sessionId, seatNumber, {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type
      });
    } catch (err) {
      setError('Upload failed: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (submissionId) => {
    if (window.confirm('Delete this submission?')) {
      try {
        await deleteSubmission(session.sessionId, seatNumber, submissionId);
      } catch (err) {
        setError('Delete failed: ' + err.message);
      }
    }
  };

  const handleSwitchSeat = async () => {
    if (!newSeat) return;
    
    try {
      await switchSeat(session.sessionId, seatNumber, newSeat, user);
      onSwitchSeat(newSeat);
      setShowSwitchModal(false);
    } catch (err) {
      setError('Seat switch failed: ' + err.message);
    }
  };

  const availableSeats = Object.entries(seats)
    .filter(([num, data]) => num !== seatNumber && (!data.studentId || data.status === 'empty'))
    .map(([num]) => num);

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '700px' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{liveSession.title}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{liveSession.subject}</p>
            <p style={{ color: 'var(--maroon-light)', margin: 0 }}>
              Seat #{seatNumber} • {mySubmissions.length}/{liveSession.assignmentCount} submitted
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${isSharing ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleToggleSharing}
              style={{ background: isSharing ? 'var(--success)' : '' }}
            >
              {isSharing ? 'Stop Sharing' : 'Share Screen'}
            </button>
            <button className="btn btn-outline" onClick={() => setShowSwitchModal(true)}>
              Switch PC
            </button>
          </div>
        </div>
      </div>

      {/* Reference File */}
      {liveSession.referenceFileUrl && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">Reference Material</div>
          <a 
            href={liveSession.referenceFileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-block' }}
          >
            Download Reference File
          </a>
        </div>
      )}

      {/* Upload Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Upload Assignment</div>
        
        <div 
          className="file-upload"
          onClick={() => document.getElementById('assignmentFile').click()}
          style={{ marginBottom: '1rem' }}
        >
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              Click to upload your assignment file
            </span>
          )}
        </div>
        <input
          type="file"
          id="assignmentFile"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          disabled={uploading}
        />
        
        {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
      </div>

      {/* Submissions List */}
      <div className="card">
        <div className="card-header">Your Submissions ({mySubmissions.length})</div>
        
        {mySubmissions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No submissions yet. Upload your first file above.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mySubmissions.map(([id, sub]) => (
              <div 
                key={id}
                style={{
                  background: 'var(--bg-dark)',
                  padding: '1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{sub.fileName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(sub.uploadedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a 
                    href={sub.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    View
                  </a>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleDelete(id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--error)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Switch Seat Modal */}
      {showSwitchModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="card" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Switch PC</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Your submissions will be preserved.
            </p>
            
            {availableSeats.length === 0 ? (
              <p style={{ color: 'var(--warning)' }}>No available seats to switch to.</p>
            ) : (
              <select 
                className="form-select"
                value={newSeat || ''}
                onChange={(e) => setNewSeat(e.target.value)}
                style={{ marginBottom: '1rem' }}
              >
                <option value="">Select a seat...</option>
                {availableSeats.map(num => (
                  <option key={num} value={num}>Seat #{num}</option>
                ))}
              </select>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowSwitchModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSwitchSeat}
                disabled={!newSeat}
                style={{ flex: 1 }}
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLabView;
