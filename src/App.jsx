import React, { useState, useEffect } from 'react';
import { db, ref, get, child, set } from './firebase';
import HomePage from './components/HomePage';
import FacultyDashboard from './components/FacultyDashboard';
import StartLabForm from './components/StartLabForm';
import LabSessionView from './components/LabSessionView';
import PreviousLabs from './components/PreviousLabs';
import SemesterReport from './components/SemesterReport';
import StudentDashboard from './components/StudentDashboard';
import StudentProfile from './components/StudentProfile';
import SeatSelection from './components/SeatSelection';
import StudentLabView from './components/StudentLabView';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [currentSession, setCurrentSession] = useState(null);
  const [currentSeat, setCurrentSeat] = useState(null);

  // Initialize default faculty on first load
  useEffect(() => {
    const initFaculty = async () => {
      try {
        const snapshot = await get(child(ref(db), 'faculty/6304856'));
        if (!snapshot.exists()) {
          await set(ref(db, 'faculty/6304856'), {
            id: '6304856',
            password: '123456',
            name: 'Faculty Admin',
            createdAt: Date.now()
          });
          console.log('Default faculty created');
        }
      } catch (err) {
        console.log('Firebase init:', err.message);
      }
    };
    initFaculty();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setCurrentSession(null);
    setCurrentSeat(null);
  };

  // Show home page if not logged in
  if (!user) {
    return <HomePage onLogin={handleLogin} />;
  }

  // ==================== FACULTY VIEWS ====================
  if (user.type === 'faculty') {
    return (
      <>
        <header className="header">
          <h1 className="header-title">LAB-PULSE</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>
              {user.name || user.id}
            </span>
            <button className="btn btn-outline" onClick={handleLogout} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              Logout
            </button>
          </div>
        </header>

        <div className="lab-container">
          {view === 'dashboard' && (
            <FacultyDashboard 
              user={user}
              onStartLab={() => setView('startLab')}
              onPreviousLabs={() => setView('previousLabs')}
              onSemesterReport={() => setView('semesterReport')}
              onViewSession={(session) => {
                setCurrentSession(session);
                setView('session');
              }}
            />
          )}

          {view === 'startLab' && (
            <StartLabForm 
              user={user}
              onBack={() => setView('dashboard')}
              onSessionCreated={(session) => {
                setCurrentSession(session);
                setView('session');
              }}
            />
          )}

          {view === 'session' && currentSession && (
            <ErrorBoundary>
              <LabSessionView 
                session={currentSession}
                onBack={() => {
                  setView('dashboard');
                  setCurrentSession(null);
                }}
                onEndSession={() => {
                  setView('dashboard');
                  setCurrentSession(null);
                }}
              />
            </ErrorBoundary>
          )}

          {view === 'previousLabs' && (
            <PreviousLabs 
              user={user}
              onBack={() => setView('dashboard')}
              onViewSession={(session) => {
                setCurrentSession(session);
                setView('session');
              }}
            />
          )}

          {view === 'semesterReport' && (
            <SemesterReport 
              user={user}
              onBack={() => setView('dashboard')}
            />
          )}
        </div>
      </>
    );
  }

  // ==================== STUDENT VIEWS ====================
  return (
    <>
      <header className="header">
        <h1 className="header-title">LAB-PULSE</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
            {user.name} ({user.sapId})
          </span>
          <button className="btn btn-outline" onClick={handleLogout} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="lab-container">
        {view === 'dashboard' && (
          <StudentDashboard 
            user={user}
            onJoinSession={(session) => {
              setCurrentSession(session);
              setView('selectSeat');
            }}
            onEditProfile={() => setView('profile')}
          />
        )}

        {view === 'profile' && (
          <StudentProfile 
            user={user}
            onBack={() => setView('dashboard')}
            onUpdate={(updatedUser) => {
              setUser(updatedUser);
              setView('dashboard');
            }}
          />
        )}

        {view === 'selectSeat' && currentSession && (
          <SeatSelection 
            session={currentSession}
            user={user}
            onSeatSelected={(seatNumber) => {
              setCurrentSeat(seatNumber);
              setView('lab');
            }}
            onBack={() => {
              setCurrentSession(null);
              setView('dashboard');
            }}
          />
        )}

        {view === 'lab' && currentSession && currentSeat && (
          <ErrorBoundary>
            <StudentLabView 
              session={currentSession}
              user={user}
              seatNumber={currentSeat}
              onSwitchSeat={(newSeat) => setCurrentSeat(newSeat)}
              onLeave={() => {
                setCurrentSession(null);
                setCurrentSeat(null);
                setView('dashboard');
              }}
            />
          </ErrorBoundary>
        )}
      </div>
    </>
  );
}

export default App;
