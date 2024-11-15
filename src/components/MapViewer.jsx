import React, { useState } from "react";

const MapViewer = ({
  selectedMap,
  pins,
  connections,
  connectingPin,
  onMapClick,
  onPinClick,
  mapperRef,
  setPins,
  onPinDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPin, setDraggedPin] = useState(null);

  const handlePinContextMenu = (e, pinId) => {
    e.preventDefault(); // Prevent default context menu
    e.stopPropagation();
    onPinDelete(pinId);
  };

  const handleMouseDown = (e, pin) => {
    e.stopPropagation(); // Prevent map click event
    setIsDragging(true);
    setDraggedPin(pin);
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggedPin) {
      const mapBounds = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - mapBounds.left) / mapBounds.width) * 100;
      const y = ((e.clientY - mapBounds.top) / mapBounds.height) * 100;

      // Ensure coordinates stay within bounds (0-100)
      const clampedX = Math.min(Math.max(x, 0), 100);
      const clampedY = Math.min(Math.max(y, 0), 100);

      // Calculate world coordinates if calibrated
      let worldCoords = { x: 0, y: 0 };
      if (mapperRef.current.isCalibrated) {
        worldCoords = mapperRef.current.mapToWorld(clampedX, clampedY);
      }

      // Update pin position
      const updatedPins = pins.map((p) => {
        if (p.id === draggedPin.id) {
          return {
            ...p,
            x: clampedX,
            y: clampedY,
            worldX: worldCoords.x,
            worldY: worldCoords.y,
          };
        }
        return p;
      });

      setPins(updatedPins);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPin(null);
  };

  if (!selectedMap) {
    return <div className="map-viewer">Please select a map</div>;
  }

  return (
    <div className="map-viewer">
      <div
        className="map-container"
        onClick={onMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={selectedMap.url} alt={selectedMap.name} />

        {/* Draw connections */}
        <svg className="connections-layer">
          {connections.map((conn) => {
            const fromPin = pins.find((p) => p.id === conn.from);
            const toPin = pins.find((p) => p.id === conn.to);
            return (
              <line
                key={conn.id}
                x1={`${fromPin.x}%`}
                y1={`${fromPin.y}%`}
                x2={`${toPin.x}%`}
                y2={`${toPin.y}%`}
                className="connection-line"
              />
            );
          })}

          {/* Draw line while connecting */}
          {connectingPin && (
            <line
              className="connecting-line"
              x1={`${pins.find((p) => p.id === connectingPin).x}%`}
              y1={`${pins.find((p) => p.id === connectingPin).y}%`}
              x2="50%"
              y2="50%"
              style={{
                opacity: 0.5,
              }}
            />
          )}
        </svg>

        {/* Draw pins */}
        {pins.map((pin, index) => (
          <div
            key={pin.id}
            className={`pin-container ${
              connectingPin === pin.id ? "connecting" : ""
            } 
                       ${
                         connectingPin !== null && connectingPin !== pin.id
                           ? "can-connect"
                           : ""
                       }`}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              // cursor: isDragging ? "grabbing" : "grab",
            }}
            onClick={(e) => onPinClick(pin.id, e)}
            onMouseDown={(e) => handleMouseDown(e, pin)}
            onContextMenu={(e) => handlePinContextMenu(e, pin.id)} // Add this handler
            title="Right-click to delete" // Add tooltip
          >
            <div className="pin-number">{index + 1}</div>
            <div className="pin" title={pin.label} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapViewer;
