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

// Lab 1,2,3: Left | Middle opposite-facing | Right + Faculty Table
const Lab123 = ({ seats = {}, onSeatClick, selectedSeat, sessionMode, selectionMode }) => {
  // Generate seat numbers
  const leftColumn = Array.from({ length: 8 }, (_, i) => i + 1);
  const middleLeft = Array.from({ length: 8 }, (_, i) => i + 9);
  const middleRight = Array.from({ length: 8 }, (_, i) => i + 17);
  const rightColumn = Array.from({ length: 8 }, (_, i) => i + 25);

  const getSeatStatus = (num) => seats[num]?.status || 'empty';

  const handleClick = (num) => {
    if (onSeatClick) onSeatClick(num);
  };

  return (
    <div className="lab-layout" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '2rem' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {leftColumn.map(num => (
          <SeatNode 
            key={num} 
            id={num} 
            status={getSeatStatus(num)}
            onClick={handleClick}
            isSelected={selectedSeat === num}
          />
        ))}
      </div>
      
      {/* Divider */}
      <div className="column-divider" style={{ height: '340px' }}></div>
      
      {/* Middle Section - Opposite Facing */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {middleLeft.map(num => (
            <SeatNode 
              key={num} 
              id={num} 
              status={getSeatStatus(num)}
              onClick={handleClick}
              isSelected={selectedSeat === num}
            />
          ))}
        </div>
        <div style={{ width: '5px', background: '#555', borderRadius: '2px', height: '340px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {middleRight.map(num => (
            <SeatNode 
              key={num} 
              id={num} 
              status={getSeatStatus(num)}
              onClick={handleClick}
              isSelected={selectedSeat === num}
            />
          ))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="column-divider" style={{ height: '340px' }}></div>
      
      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rightColumn.map(num => (
          <SeatNode 
            key={num} 
            id={num} 
            status={getSeatStatus(num)}
            onClick={handleClick}
            isSelected={selectedSeat === num}
          />
        ))}
      </div>
      
      {/* Faculty Table */}
      <div className="faculty-table">LAB 1, 2, 3</div>
    </div>
  );
};

export default Lab123;
