import React from 'react';

const SeatNode = ({ id, status, onClick, isSelected }) => {
  const getClassName = () => {
    if (isSelected) return 'seat-node';
    return `seat-node ${status || 'empty'}`;
  };

  const getStyle = () => {
    if (isSelected) {
      return { background: 'var(--maroon)', color: 'var(--white)', borderColor: 'var(--maroon)' };
    }
    return {};
  };

  return (
    <div 
      className={getClassName()} 
      style={getStyle()}
      onClick={() => onClick && onClick(id)}
      title={`Seat ${id}`}
    >
      {id}
    </div>
  );
};

// HPC: 3 columns, 5 rows, 2 PCs per row = 30 total
const HPC = ({ seats = {}, onSeatClick, selectedSeat, sessionMode, selectionMode }) => {
  // 3 columns, each with 5 rows of 2 PCs
  const columns = [
    Array.from({ length: 5 }, (_, row) => [row * 2 + 1, row * 2 + 2]),
    Array.from({ length: 5 }, (_, row) => [row * 2 + 11, row * 2 + 12]),
    Array.from({ length: 5 }, (_, row) => [row * 2 + 21, row * 2 + 22]),
  ];

  const getSeatStatus = (num) => seats[num]?.status || 'empty';

  const handleClick = (num) => {
    if (onSeatClick) onSeatClick(num);
  };

  return (
    <div className="lab-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', padding: '2rem', justifyContent: 'center' }}>
      
      {columns.map((column, colIdx) => (
        <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {column.map((row, rowIdx) => (
            <div key={rowIdx} style={{ 
              display: 'flex', 
              gap: '0.4rem',
              background: 'var(--bg-card)',
              padding: '0.4rem',
              borderRadius: '4px'
            }}>
              {row.map(num => (
                <SeatNode 
                  key={num} 
                  id={num} 
                  status={getSeatStatus(num)}
                  onClick={handleClick}
                  isSelected={selectedSeat === num}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
      
      {/* Faculty Table */}
      <div className="faculty-table">HPC LAB</div>
    </div>
  );
};

export default HPC;
