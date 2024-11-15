import React from 'react';

const PinList = ({ pins, connections, onPinDelete, onConnectionDelete }) => {
  return (
    <div className="pin-list">
      <h2>Pins</h2>
      {pins.length === 0 ? (
        <p>No pins added yet</p>
      ) : (
        <>
          <ul>
            {pins.map((pin, index) => (
              <li key={pin.id}>
                <div className="pin-list-item">
                  <span className="pin-list-number">{index + 1}</span>
                  <span className="pin-list-coords">
                    X: {pin.x.toFixed(2)}, Y: {pin.y.toFixed(2)}
                  </span>
                  <button onClick={() => onPinDelete(pin.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          
          <h3>Connections</h3>
          <ul>
            {connections.map(conn => {
              const fromPin = pins.find(p => p.id === conn.from);
              const toPin = pins.find(p => p.id === conn.to);
              const fromIndex = pins.indexOf(fromPin);
              const toIndex = pins.indexOf(toPin);
              
              return (
                <li key={conn.id} className="connection-list-item">
                  Point {fromIndex + 1} → Point {toIndex + 1}
                  <button onClick={() => onConnectionDelete(conn.id)}>Delete</button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default PinList;