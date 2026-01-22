import React, { useState, useEffect } from 'react';
import { endSession, updateStudentMarks, getSessionReport, generateCSV } from '../firebase';

const EndLabForm = ({ session, onBack, onConfirm }) => {
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Safety check for session data
  if (!session || !session.sessionId) {
    return (
      <div className="card fade-in" style={{ width: '100%', maxWidth: '600px' }}>
        <p style={{ color: 'var(--error)' }}>Invalid session data</p>
        <button className="btn btn-outline" onClick={onBack} style={{ width: '100%' }}>
          ← Back
        </button>
      </div>
    );
  }

  useEffect(() => {
    // Initialize marks data from session seats
    const seats = session.seats || {};
    const initialMarks = {};
    Object.entries(seats).forEach(([seatNum, seatData]) => {
      if (seatData.studentId) {
        initialMarks[seatNum] = seatData.marks || 0;
      }
    });
    setMarksData(initialMarks);
  }, [session]);

  const handleMarksChange = (seatNumber, value) => {
    setMarksData({
      ...marksData,
      [seatNumber]: Math.max(0, Math.min(100, parseInt(value) || 0))
    });
  };

  const downloadCSV = async () => {
    try {
      const reportData = await getSessionReport(session.sessionId);
      if (reportData) {
        const csvContent = generateCSV(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.title.replace(/\s+/g, '_')}_${session.year}_${session.division}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError('Failed to download report: ' + err.message);
    }
  };

  const handleEndSession = async () => {
    setLoading(true);
    setError('');

    try {
      // Update all marks in database
      const seats = session.seats || {};
      for (const [seatNum, seatData] of Object.entries(seats)) {
        if (seatData.studentId && marksData[seatNum] !== undefined) {
          await updateStudentMarks(session.sessionId, seatNum, marksData[seatNum]);
        }
      }

      // End the session with marks data
      await endSession(session.sessionId, marksData);
      setSubmitted(true);
      setTimeout(() => {
        onConfirm();
      }, 1500);
    } catch (err) {
      setError('Failed to end session: ' + err.message);
    }
    setLoading(false);
  };

  const seats = session.seats || {};
  const studentSeats = Object.entries(seats).filter(([_, data]) => data.studentId);

  return (
    <div className="card fade-in" style={{ width: '100%', maxWidth: '600px' }}>
      <div className="card-header">End Lab Session & Assign Marks</div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>{session?.title || 'Lab Session'}</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {session?.subject || 'Unknown'} • Year {session?.year || '-'} • Division {session?.division || '-'}
        </p>
      </div>

      {submitted && (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid var(--success)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          color: 'var(--success)'
        }}>
          SUCCESS: Session ended successfully! Marks have been recorded.
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(244, 67, 54, 0.1)',
          border: '2px solid var(--error)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          color: 'var(--error)'
        }}>
          ERROR: {error}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          Student Marks ({studentSeats.length} students)
        </div>

        {studentSeats.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No students registered for this session.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studentSeats.map(([seatNum, seatData]) => (
              <div
                key={seatNum}
                style={{
                  background: 'var(--bg-dark)',
                  padding: '1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>Seat #{seatNum}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {seatData.studentName} ({seatData.studentId})
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Submitted: {Object.keys(seatData.submissions || {}).length} files
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={marksData[seatNum] || 0}
                    onChange={(e) => handleMarksChange(seatNum, e.target.value)}
                    className="form-input"
                    placeholder="Marks"
                    style={{ width: '70px', padding: '0.5rem' }}
                    disabled={loading}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ 100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          className="btn btn-secondary"
          onClick={downloadCSV}
          disabled={loading}
          style={{ flex: 1 }}
        >
          Download CSV Report
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          className="btn btn-outline"
          onClick={onBack}
          disabled={loading}
          style={{ flex: 1 }}
        >
          ← Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleEndSession}
          disabled={loading || submitted}
          style={{ flex: 1, background: 'var(--maroon)' }}
        >
          {loading ? 'Ending...' : submitted ? '[Done]' : 'End Session'}
        </button>
      </div>
    </div>
  );
};

export default EndLabForm;
