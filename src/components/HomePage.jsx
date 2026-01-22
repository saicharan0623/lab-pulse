import React, { useState, useEffect } from 'react';
import { db, ref, get, child, set } from '../firebase';
import nmimsLogo from '../assets/nmims2.jpg';

const HomePage = ({ onLogin }) => {
  const [mode, setMode] = useState('select');
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    name: '',
    year: '',
    course: '',
    division: '',
    rollNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ id: '', password: '', confirmPassword: '', name: '', year: '', course: '', division: '', rollNumber: '' });
    setError('');
  };

  // Faculty Login
  const handleFacultyLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const snapshot = await get(child(ref(db), `faculty/${formData.id}`));
      if (snapshot.exists()) {
        const faculty = snapshot.val();
        if (faculty.password === formData.password) {
          onLogin({ type: 'faculty', ...faculty });
        } else {
          setError('Invalid password');
        }
      } else {
        setError('Faculty ID not found');
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    }
    setLoading(false);
  };

  // Student Login
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const snapshot = await get(child(ref(db), `students/${formData.id}`));
      if (snapshot.exists()) {
        const student = snapshot.val();
        if (student.password === formData.password) {
          onLogin({ type: 'student', ...student });
        } else {
          setError('Invalid password');
        }
      } else {
        setError('SAP ID not registered. Please register first.');
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    }
    setLoading(false);
  };

  // Student Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validations
    if (!formData.name.trim()) { setError('Name is required'); setLoading(false); return; }
    if (!formData.year) { setError('Year is required'); setLoading(false); return; }
    if (!formData.id || formData.id.length < 8) { setError('SAP ID must be at least 8 digits'); setLoading(false); return; }
    if (!formData.course) { setError('Course is required'); setLoading(false); return; }
    if (!formData.password || formData.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }

    try {
      const snapshot = await get(child(ref(db), `students/${formData.id}`));
      if (snapshot.exists()) {
        setError('SAP ID already registered');
        setLoading(false);
        return;
      }

      const studentData = {
        sapId: formData.id,
        name: formData.name,
        year: formData.year,
        course: formData.course,
        division: formData.division || null,
        rollNumber: formData.rollNumber || null,
        password: formData.password,
        createdAt: Date.now()
      };

      await set(ref(db, `students/${formData.id}`), studentData);
      onLogin({ type: 'student', ...studentData });
    } catch (err) {
      setError('Registration failed: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandSection}>
          <div style={styles.nmimsLogoContainer}>
            <img src={nmimsLogo} alt="NMIMS Logo" style={styles.nmimsLogo} />
          </div>
          <h1 style={styles.brandTitle}>
            <span style={{ color: 'white' }}>LAB</span>PULSE
          </h1>
          <p style={styles.brandTagline}>Real-Time Lab Progress Monitoring</p>
          <div style={styles.featureList}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <span>Live session tracking</span>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <span>Instant submission updates</span>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <span>Comprehensive analytics</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          {mode === 'select' && (
            <div style={styles.formContent}>
              <h2 style={styles.formTitle}>Welcome Back</h2>
              <p style={styles.formSubtitle}>Select your role to continue</p>
              
              <div style={styles.roleButtons}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem' }} 
                  onClick={() => setMode('faculty')}
                >
                  Faculty Login
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '1rem' }} 
                  onClick={() => setMode('student')}
                >
                  Student Login
                </button>
              </div>

              <p style={styles.registerPrompt}>
                New student? <span onClick={() => setMode('register')} style={styles.link}>Create an account</span>
              </p>
            </div>
          )}

          {mode === 'faculty' && (
            <form onSubmit={handleFacultyLogin} style={styles.formContent}>
              <h2 style={styles.formTitle}>Faculty Login</h2>
              <p style={styles.formSubtitle}>Enter your credentials to access the dashboard</p>
              
              <div className="form-group">
                <label className="form-label">Faculty ID</label>
                <input 
                  type="text" 
                  name="id" 
                  placeholder="Enter your faculty ID" 
                  value={formData.id} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Enter your password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p style={styles.backLink} onClick={() => { setMode('select'); resetForm(); }}>
                Back to role selection
              </p>
            </form>
          )}

          {mode === 'student' && (
            <form onSubmit={handleStudentLogin} style={styles.formContent}>
              <h2 style={styles.formTitle}>Student Login</h2>
              <p style={styles.formSubtitle}>Access your lab sessions</p>
              
              <div className="form-group">
                <label className="form-label">SAP ID</label>
                <input 
                  type="text" 
                  name="id" 
                  placeholder="Enter your SAP ID" 
                  value={formData.id} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Enter your password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p style={styles.registerPrompt}>
                New student? <span onClick={() => setMode('register')} style={styles.link}>Create an account</span>
              </p>

              <p style={styles.backLink} onClick={() => { setMode('select'); resetForm(); }}>
                Back to role selection
              </p>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} style={styles.formContent}>
              <h2 style={styles.formTitle}>Student Registration</h2>
              <p style={styles.formSubtitle}>Create your account to get started</p>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Enter your full name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select name="year" value={formData.year} onChange={handleChange} className="form-select" required>
                    <option value="">Select</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select name="course" value={formData.course} onChange={handleChange} className="form-select" required>
                    <option value="">Select</option>
                    <option value="CE">Computer Engineering</option>
                    <option value="CSDS">Computer Science & DS</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">SAP ID</label>
                <input 
                  type="text" 
                  name="id" 
                  placeholder="Enter your SAP ID" 
                  value={formData.id} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Roll Number (Optional)</label>
                <input 
                  type="text" 
                  name="rollNumber" 
                  placeholder="Enter your roll number" 
                  value={formData.rollNumber} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>

              {formData.year === '1' && (
                <div className="form-group">
                  <label className="form-label">Division (Optional)</label>
                  <select name="division" value={formData.division} onChange={handleChange} className="form-select">
                    <option value="">Select division</option>
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                    <option value="D">Division D</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Create a password (min 6 characters)" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  placeholder="Confirm your password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p style={styles.backLink} onClick={() => { setMode('select'); resetForm(); }}>
                Back to role selection
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    background: 'white',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #800000 0%, #5c0000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
  },
  brandSection: {
    color: 'white',
    maxWidth: '500px',
    zIndex: 1,
    textAlign: 'center',
  },
  nmimsLogoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '0.5rem',
    animation: 'fadeIn 0.6s ease-in',
  },
  nmimsLogo: {
    height: '80px',
    width: 'auto',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
  },

  brandTitle: {
    fontSize: '3.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    letterSpacing: '2px',
  },
  brandTagline: {
    fontSize: '1.25rem',
    marginBottom: '3rem',
    opacity: 0.9,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '1.1rem',
  },
  featureIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: '#f8f9fa',
  },
  formCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '480px',
    padding: '3rem',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '0.25rem',
  },
  formSubtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  roleButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  registerPrompt: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '0.5rem',
  },
  link: {
    color: '#800000',
    cursor: 'pointer',
    fontWeight: '600',
    textDecoration: 'none',
  },
  backLink: {
    textAlign: 'center',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
};

export default HomePage;
