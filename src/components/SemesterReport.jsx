import React, { useState, useEffect } from 'react';
import { getSemesterReport } from '../firebase';
import { curriculum } from '../data/curriculum';

const SemesterReport = ({ user, onBack }) => {
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);

  useEffect(() => {
    // Update available semesters when year changes
    const semesters = curriculum.semesters[parseInt(selectedYear)] || [];
    setAvailableSemesters(semesters);
    if (semesters.length > 0) {
      setSelectedSemester(semesters[0].id.toString());
    }
  }, [selectedYear]);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSemesterReport(user.id, parseInt(selectedYear), parseInt(selectedSemester));
      setReportData(data);
    } catch (err) {
      setError('Failed to load report: ' + err.message);
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (!reportData) return;

    const headers = ['SAP ID', 'Student Name', ...reportData.students[0].labs.map(l => l.subject), 'Total Marks', 'Average'];
    const rows = reportData.students.map(student => {
      const labMarks = student.labs.map(l => l.marks);
      const totalMarks = labMarks.reduce((a, b) => a + b, 0);
      const avgMarks = labMarks.length > 0 ? (totalMarks / labMarks.length).toFixed(1) : 0;
      return [student.sapId, student.studentName, ...labMarks, totalMarks, avgMarks];
    });

    const csvContent = [
      ['Semester Report'],
      ['Year', selectedYear],
      ['Semester', selectedSemester],
      ['Sessions', reportData.sessions],
      ['Total Students', reportData.students.length],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `semester_report_year${selectedYear}_sem${selectedSemester}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getYearLabel = (year) => curriculum.years.find(y => y.id === year)?.label || '';
  const getSemesterLabel = (sem) => curriculum.semesters[parseInt(selectedYear)]?.find(s => s.id === sem)?.label || '';

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Semester Report</h2>
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Select Semester</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-select"
            >
              {curriculum.years.map(y => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-select"
            >
              {availableSemesters.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={loadReport}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
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

      {reportData && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{reportData.sessions}</div>
              <div className="stat-label">Lab Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{reportData.students.length}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>
                {reportData.students.length > 0 
                  ? ((reportData.students.reduce((sum, s) => sum + s.labs.reduce((a, b) => a + b.marks, 0), 0) / 
                    (reportData.students.length * reportData.sessions)).toFixed(1))
                  : 0}
              </div>
              <div className="stat-label">Avg Marks</div>
            </div>
          </div>

          {/* Download Button */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={downloadCSV}
              style={{ width: '100%' }}
            >
              Download Semester Report (CSV)
            </button>
          </div>

          {/* Students Table */}
          <div className="card">
            <div className="card-header">
              {getYearLabel(parseInt(selectedYear))} • {getSemesterLabel(parseInt(selectedSemester))}
            </div>

            {reportData.students.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                No students found for this semester.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--bg-dark)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>SAP ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
                      {reportData.students[0]?.labs.map((lab, idx) => (
                        <th key={idx} style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.85rem' }}>
                          {lab.subject}
                        </th>
                      ))}
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Total</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.students.map((student, idx) => {
                      const totalMarks = student.labs.reduce((sum, lab) => sum + lab.marks, 0);
                      const avgMarks = student.labs.length > 0 ? (totalMarks / student.labs.length).toFixed(1) : 0;
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--bg-dark)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.1)'
                          }}
                        >
                          <td style={{ padding: '1rem' }}>{student.sapId}</td>
                          <td style={{ padding: '1rem' }}>{student.studentName}</td>
                          {student.labs.map((lab, labIdx) => (
                            <td key={labIdx} style={{ padding: '1rem', textAlign: 'center' }}>
                              <span style={{
                                background: lab.marks >= 60 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                color: lab.marks >= 60 ? 'var(--success)' : 'var(--error)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '0.9rem'
                              }}>
                                {lab.marks}
                              </span>
                            </td>
                          ))}
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                            <span style={{
                              background: 'var(--bg-dark)',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px'
                            }}>
                              {totalMarks}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                            <span style={{
                              background: avgMarks >= 60 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                              color: avgMarks >= 60 ? 'var(--success)' : 'var(--error)',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px'
                            }}>
                              {avgMarks}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SemesterReport;
