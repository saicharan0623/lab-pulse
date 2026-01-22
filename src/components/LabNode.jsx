import React from 'react';

const LabNode = ({ id, status, studentName }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'working': return 'var(--status-working)';
      case 'done': return 'var(--status-done)';
      case 'error': return 'var(--status-error)';
      default: return 'var(--status-idle)';
    }
  };

  const nodeStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    backgroundColor: '#1e293b',
    border: `2px solid ${getStatusColor()}`,
    boxShadow: status !== 'idle' ? `0 0 15px ${getStatusColor()}` : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  return (
    <div className="lab-node" style={nodeStyle} title={`${id}: ${studentName || 'Empty'}`}>
      <span style={{ fontSize: '0.7em', color: '#94a3b8', fontFamily: 'monospace' }}>
        {id.split('-').pop()}
      </span>
      {status === 'working' && (
        <div className="pulse-ring"></div>
      )}
    </div>
  );
};

export default LabNode;
