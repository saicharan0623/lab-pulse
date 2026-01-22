import React, { useState, useEffect } from 'react';
import { getSessionReport, generateCSV } from '../firebase';

const SessionReport = ({ session, onBack }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    loadReport();
  }, [session.sessionId]);

  const loadReport = async () => {
    try {
      const data = await getSessionReport(session.sessionId);
      setReportData(data);
    } catch (err) {
      setError('Failed to load report: ' + err.message);
    }
    setLoading(false);
  };

  const downloadCSV = () => {
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
  };

  if (loading) {
    return (
      <div className="card fade-in" style={{ width: '100%', maxWidth: '800px' }}>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading report...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="card fade-in" style={{ width: '100%', maxWidth: '800px' }}>
        <p style={{ color: 'var(--error)', textAlign: 'center' }}>Failed to load report</p>
        <button className="btn btn-outline" onClick={onBack} style={{ width: '100%', marginTop: '1rem' }}>
          ← Back
        </button>
      </div>
    );
  }

  const totalMarks = reportData.students.reduce((sum, s) => sum + (s.marks || 0), 0);
  const avgMarks = reportData.students.length > 0 ? (totalMarks / reportData.students.length).toFixed(2) : 0;
  const maxMarks = reportData.students.length > 0 ? Math.max(...reportData.students.map(s => s.marks || 0)) : 0;

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{reportData?.title || session?.title || 'Lab Session'}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
            {reportData?.subject || session?.subject || 'Unknown'} • Year {reportData?.year || session?.year || '-'} • Division {reportData?.division || session?.division || '-'}
          </p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 67, 54, 0.1)',
          border: '2px solid var(--error)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          color: 'var(--error)'
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{reportData?.students?.length || 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{avgMarks}</div>
          <div className="stat-label">Average Marks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{maxMarks}</div>
          <div className="stat-label">Highest Marks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>
            {reportData?.endedAt ? new Date(reportData.endedAt).toLocaleDateString() : 'N/A'}
          </div>
          <div className="stat-label">Date</div>
        </div>
      </div>

      {/* Download Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={downloadCSV} style={{ width: '100%' }}>
          Download CSV Report
        </button>
      </div>

      {/* Student Marks Table */}
      <div className="card">
        <div className="card-header">Student Marks & Submissions</div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-dark)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Seat</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>SAP ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Submissions</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Marks</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.students && reportData.students.length > 0 ? (
                reportData.students.map((student, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--bg-dark)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>#{student?.seatNumber || idx + 1}</td>
                    <td style={{ padding: '1rem' }}>{student?.sapId || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{student?.studentName || 'N/A'}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: 'var(--bg-dark)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                      }}>
                        {student?.submissions || 0}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                      <span style={{
                        background: (student?.marks || 0) >= 60 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        color: (student?.marks || 0) >= 60 ? 'var(--success)' : 'var(--error)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px'
                      }}>
                        {student?.marks || 0}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: student?.status === 'submitted' ? 'var(--success)' : 'var(--warning)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                      }}>
                        {student?.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionReport;
