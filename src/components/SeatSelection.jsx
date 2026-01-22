import React, { useState, useEffect } from 'react';
import { subscribeToSeats, occupySeat } from '../firebase';
import Lab123 from './Lab123';
import Lab4567 from './Lab4567';
import HPC from './HPC';

const SeatSelection = ({ session, user, onSeatSelected, onBack }) => {
  const [seats, setSeats] = useState({});
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToSeats(session.sessionId, (seatsData) => {
      setSeats(seatsData);
    });
    return () => unsubscribe();
  }, [session.sessionId]);

  const handleSeatClick = (seatNumber) => {
    const seatData = seats[seatNumber];
    // Only allow selecting empty seats
    if (!seatData || seatData.status === 'empty' || !seatData.studentId) {
      setSelectedSeat(seatNumber);
      setError('');
    }
  };

  const handleConfirm = async () => {
    if (!selectedSeat) return;
    
    setLoading(true);
    setError('');
    
    try {
      await occupySeat(session.sessionId, selectedSeat, {
        sapId: user.sapId,
        name: user.name
      });
      onSeatSelected(selectedSeat);
    } catch (err) {
      setError('Failed to occupy seat: ' + err.message);
    }
    setLoading(false);
  };

  const renderLabLayout = () => {
    const props = {
      seats,
      onSeatClick: handleSeatClick,
      selectedSeat,
      selectionMode: true,
      labId: session.labId
    };

    switch (session.labId) {
      case 'lab1':
      case 'lab2':
      case 'lab3':
      case 'lab123': return <Lab123 {...props} />;
      case 'lab4':
      case 'lab5':
      case 'lab6':
      case 'lab456': return <Lab4567 {...props} />;
      case 'hpc': return <HPC {...props} />;
      default: return <div>Unknown lab</div>;
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '1000px' }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{session.title}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>{session.subject}</p>
          </div>
          <button className="btn btn-outline" onClick={onBack}>← Back</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Select Your Seat</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Click on an empty (white) seat to select it
        </p>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        marginBottom: '1.5rem',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 20, height: 20, background: 'var(--seat-empty)', borderRadius: 4, border: '1px solid #444' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 20, height: 20, background: 'var(--seat-occupied)', borderRadius: 4 }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Occupied</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 20, height: 20, background: 'var(--maroon)', borderRadius: 4 }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Selected</span>
        </div>
      </div>

      {/* Lab Layout */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {renderLabLayout()}
      </div>

      {/* Confirm Selection */}
      {selectedSeat && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>
            You selected <strong>Seat #{selectedSeat}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {user.name} • {user.sapId}
          </p>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={loading}
            style={{ minWidth: '200px' }}
          >
            {loading ? 'Confirming...' : 'Confirm Seat'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
