import React, { useState } from 'react';
import { updateStudent } from '../firebase';
import { curriculum } from '../data/curriculum';

const StudentProfile = ({ user, onBack, onUpdate }) => {
  const [formData, setFormData] = useState({
    year: user.year || '',
    division: user.division || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canPromote = parseInt(user.year) < 4;
  const nextYear = parseInt(user.year) + 1;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateStudent(user.sapId, {
        year: parseInt(formData.year),
        division: formData.division
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onUpdate({
          ...user,
          year: parseInt(formData.year),
          division: formData.division
        });
      }, 1500);
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Student Profile</h2>
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Profile Information</div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>SAP ID:</strong> {user.sapId}</p>
          <p><strong>Course:</strong> {user.course}</p>
        </div>
      </div>

      {success && (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid var(--success)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          color: 'var(--success)'
        }}>
          {success}
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
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">Update Academic Details</div>

        <div className="form-group">
          <label className="form-label">Current Year</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value="">Select year...</option>
            {curriculum.years.map(y => (
              <option key={y.id} value={y.id}>{y.label}</option>
            ))}
          </select>
          {canPromote && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              After completing your semester, you can promote to Year {nextYear}
            </p>
          )}
          {!canPromote && (
            <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              You are in the final year (Year 4). Semester 8 has no labs.
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Division</label>
          <select
            name="division"
            value={formData.division}
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value="">Select division...</option>
            {curriculum.divisions.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
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
            onClick={handleUpdate}
            disabled={loading || !formData.year || !formData.division}
            style={{ flex: 1 }}
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
