import React, { useState } from 'react';
import { createSession, uploadFile } from '../firebase';
import { curriculum, getSubjectsForYear, getSubjectsForSemester } from '../data/curriculum';

const StartLabForm = ({ user, onBack, onSessionCreated }) => {
  const [formData, setFormData] = useState({
    labId: '',
    year: '',
    division: '',
    semester: '',
    subject: '',
    title: '',
    startTime: '',
    endTime: '',
    assignmentCount: 1,
  });
  const [referenceFile, setReferenceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const labs = [
    { id: 'lab123', name: 'Lab 1, 2, 3 (3rd Floor)' },
    { id: 'lab456', name: 'Lab 4, 5, 6 (4th Floor)' },
    { id: 'hpc', name: 'HPC Lab' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // When year changes, update available semesters and reset semester/subject
    if (name === 'year' && value) {
      const semesters = getSubjectsForYear(parseInt(value));
      setAvailableSemesters(semesters);
      newFormData.semester = '';
      newFormData.subject = '';
      setAvailableSubjects([]);
    }

    // When semester changes, update available subjects
    if (name === 'semester' && value) {
      const subjects = getSubjectsForSemester(parseInt(newFormData.year), parseInt(value));
      setAvailableSubjects(subjects);
      newFormData.subject = '';
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.labId || !formData.year || !formData.division || !formData.semester || !formData.subject || !formData.title) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      let referenceFileUrl = null;
      if (referenceFile) {
        const path = `sessions/${Date.now()}_${referenceFile.name}`;
        referenceFileUrl = await uploadFile(referenceFile, path);
      }

      const sessionData = {
        ...formData,
        year: parseInt(formData.year),
        division: formData.division,
        semester: parseInt(formData.semester),
        facultyId: user.id,
        facultyName: user.name,
        referenceFileUrl,
        assignmentCount: parseInt(formData.assignmentCount)
      };

      const sessionId = await createSession(sessionData);
      onSessionCreated({ ...sessionData, sessionId });
    } catch (err) {
      setError('Failed to start lab: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="card fade-in" style={{ width: '100%', maxWidth: '500px' }}>
      <div className="card-header">🚀 Start New Lab Session</div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Select Lab *</label>
          <select 
            name="labId" 
            value={formData.labId} 
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Choose a lab...</option>
            {labs.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Year *</label>
          <select 
            name="year" 
            value={formData.year} 
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Choose a year...</option>
            {curriculum.years.map(y => (
              <option key={y.id} value={y.id}>{y.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Division *</label>
          <select 
            name="division" 
            value={formData.division} 
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Choose a division...</option>
            {curriculum.divisions.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Semester *</label>
          <select 
            name="semester" 
            value={formData.semester} 
            onChange={handleChange}
            className="form-select"
            required
            disabled={!formData.year}
          >
            <option value="">Choose a semester...</option>
            {availableSemesters.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Subject *</label>
          <select 
            name="subject" 
            value={formData.subject} 
            onChange={handleChange}
            className="form-select"
            required
            disabled={!formData.semester}
          >
            <option value="">Choose a subject...</option>
            {availableSubjects.map(subject => (
              <option key={subject} value={subject}>
                {curriculum.subjectMap[subject]?.label || subject}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Experiment Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Implementation of Binary Search Tree"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Number of Assignments</label>
          <input
            type="number"
            name="assignmentCount"
            value={formData.assignmentCount}
            onChange={handleChange}
            className="form-input"
            min="1"
            max="10"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reference File (Optional)</label>
          <div 
            className="file-upload"
            onClick={() => document.getElementById('refFile').click()}
          >
            {referenceFile ? (
              <span>📄 {referenceFile.name}</span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                Click to upload reference material
              </span>
            )}
          </div>
          <input
            type="file"
            id="refFile"
            style={{ display: 'none' }}
            onChange={(e) => setReferenceFile(e.target.files[0])}
          />
        </div>

        {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ flex: 1 }}
          >
            ← Back
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Starting...' : 'Start Lab'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartLabForm;
