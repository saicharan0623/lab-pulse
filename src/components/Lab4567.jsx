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

// Lab 4,5,6: 6 COLUMNS
const Lab4567 = ({ seats = {}, onSeatClick, selectedSeat, sessionMode, selectionMode, labId }) => {
  // 6 columns, 8 seats each = 48 total
  const col1 = Array.from({ length: 8 }, (_, i) => i + 1);
  const col2 = Array.from({ length: 8 }, (_, i) => i + 9);
  const col3 = Array.from({ length: 8 }, (_, i) => i + 17);
  const col4 = Array.from({ length: 8 }, (_, i) => i + 25);
  const col5 = Array.from({ length: 8 }, (_, i) => i + 33);
  const col6 = Array.from({ length: 8 }, (_, i) => i + 41);

  const getSeatStatus = (num) => seats[num]?.status || 'empty';

  const handleClick = (num) => {
    if (onSeatClick) onSeatClick(num);
  };

  return (
    <div className="lab-layout" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '2rem' }}>
      
      {/* Column 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {col1.map(num => (
          <SeatNode key={num} id={num} status={getSeatStatus(num)} onClick={handleClick} isSelected={selectedSeat === num} />
        ))}
      </div>
      
      {/* Middle Pair 1 */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {col2.map(num => (
            <SeatNode key={num} id={num} status={getSeatStatus(num)} onClick={handleClick} isSelected={selectedSeat === num} />
          ))}
        </div>
        <div style={{ width: '5px', background: '#555', borderRadius: '2px', height: '340px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {col3.map(num => (
            <SeatNode key={num} id={num} status={getSeatStatus(num)} onClick={handleClick} isSelected={selectedSeat === num} />
          ))}
        </div>
      </div>
      
      {/* Middle Pair 2 */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {col4.map(num => (
            <SeatNode key={num} id={num} status={getSeatStatus(num)} onClick={handleClick} isSelected={selectedSeat === num} />
          ))}
        </div>
        <div style={{ width: '5px', background: '#555', borderRadius: '2px', height: '340px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {col5.map(num => (
            <SeatNode key={num} id={num} status={getSeatStatus(num)} onClick={handleClick} isSelected={selectedSeat === num} />
          ))}
        </div>
      </div>
      
      {/* Column 6 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {col6.map(num => (
          <SeatNode key={num} id={num} status={getSeatStatus(num)} onClick={handleClick} isSelected={selectedSeat === num} />
        ))}
      </div>
      
      {/* Faculty Table */}
      <div className="faculty-table">
        {labId?.startsWith('lab') ? `LAB ${labId.replace('lab', '')}` : (labId === 'lab456' ? 'LAB 4, 5, 6' : 'LAB 4, 5, 6')}
      </div>
    </div>
  );
};

export default Lab4567;
