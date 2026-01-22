import React, { useState, useEffect } from 'react';
import { subscribeToSession, addSubmission, deleteSubmission, uploadFile, switchSeat, subscribeToSeats } from '../firebase';

const StudentLabView = ({ session, user, seatNumber, onSwitchSeat, onLeave }) => {
  const [liveSession, setLiveSession] = useState(session);
  const [seats, setSeats] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [newSeat, setNewSeat] = useState(null);

  useEffect(() => {
    const unsubSession = subscribeToSession(session.sessionId, (data) => {
      if (data) setLiveSession(data);
      if (data?.status === 'ended') {
        alert('Lab session has ended!');
        onLeave();
      }
    });
    
    const unsubSeats = subscribeToSeats(session.sessionId, setSeats);
    
    return () => {
      unsubSession();
      unsubSeats();
    };
  }, [session.sessionId]);

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
            <button className="btn btn-outline" onClick={() => setShowSwitchModal(true)}>
              Switch PC
            </button>
          </div>
        </div>
      </div>

      {/* Reference File */}
      {liveSession.referenceFileUrl && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">📄 Reference Material</div>
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
        <div className="card-header">📤 Upload Assignment</div>
        
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
        <div className="card-header">📁 Your Submissions ({mySubmissions.length})</div>
        
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
                  <div style={{ fontWeight: '500' }}>📄 {sub.fileName}</div>
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
