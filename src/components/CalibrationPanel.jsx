import React, { useState, useEffect } from "react";
import {
  saveCalibration,
  loadCalibration,
  deleteCalibration,
} from "../utils/calibrationStorage";

const CalibrationPanel = ({ onCalibrate, onReset, selectedMap }) => {
  const [calibrationPoints, setCalibrationPoints] = useState({
    point1: { mapX: "", mapY: "", worldX: "", worldY: "" },
    point2: { mapX: "", mapY: "", worldX: "", worldY: "" },
  });

  useEffect(() => {
    if (selectedMap) {
      const savedCalibration = loadCalibration(selectedMap.id);
      if (savedCalibration) {
        setCalibrationPoints(savedCalibration);
        onCalibrate(savedCalibration);
      } else {
        setCalibrationPoints({
          point1: { mapX: "", mapY: "", worldX: "", worldY: "" },
          point2: { mapX: "", mapY: "", worldX: "", worldY: "" },
        });
      }
    }
  }, [selectedMap]);

  const handleInputChange = (point, field, value) => {
    setCalibrationPoints((prev) => ({
      ...prev,
      [point]: {
        ...prev[point],
        [field]: value,
      },
    }));
  };

  const handleCalibrate = () => {
    const point1Valid = Object.values(calibrationPoints.point1).every(
      (val) => val !== "" && !isNaN(parseFloat(val))
    );
    const point2Valid = Object.values(calibrationPoints.point2).every(
      (val) => val !== "" && !isNaN(parseFloat(val))
    );

    if (!point1Valid || !point2Valid) {
      alert("Please fill all fields with valid numbers");
      return;
    }

    const calibrationData = {
      point1: {
        mapX: parseFloat(calibrationPoints.point1.mapX),
        mapY: parseFloat(calibrationPoints.point1.mapY),
        worldX: parseFloat(calibrationPoints.point1.worldX),
        worldY: parseFloat(calibrationPoints.point1.worldY),
      },
      point2: {
        mapX: parseFloat(calibrationPoints.point2.mapX),
        mapY: parseFloat(calibrationPoints.point2.mapY),
        worldX: parseFloat(calibrationPoints.point2.worldX),
        worldY: parseFloat(calibrationPoints.point2.worldY),
      },
    };

    if (selectedMap) {
      saveCalibration(selectedMap.id, calibrationData);
    }

    onCalibrate(calibrationData);
  };

  const handleReset = () => {
    setCalibrationPoints({
      point1: { mapX: "", mapY: "", worldX: "", worldY: "" },
      point2: { mapX: "", mapY: "", worldX: "", worldY: "" },
    });

    if (selectedMap) {
      deleteCalibration(selectedMap.id);
    }

    onReset();
  };

  return (
    <div className="calibration-panel">
      <h3>
        Coordinate Calibration {selectedMap ? -`${selectedMap.name}` : ""}
      </h3>
      <div className="calibration-points">
        <div className="calibration-point">
          <h4>Point 1</h4>
          <div className="input-group">
            <label>
              Map X%:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point1.mapX}
                onChange={(e) =>
                  handleInputChange("point1", "mapX", e.target.value)
                }
                placeholder="0-100"
              />
            </label>
            <label>
              Map Y%:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point1.mapY}
                onChange={(e) =>
                  handleInputChange("point1", "mapY", e.target.value)
                }
                placeholder="0-100"
              />
            </label>
            <label>
              World X:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point1.worldX}
                onChange={(e) =>
                  handleInputChange("point1", "worldX", e.target.value)
                }
                placeholder="World X coordinate"
              />
            </label>
            <label>
              World Y:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point1.worldY}
                onChange={(e) =>
                  handleInputChange("point1", "worldY", e.target.value)
                }
                placeholder="World Y coordinate"
              />
            </label>
          </div>
        </div>

        <div className="calibration-point">
          <h4>Point 2</h4>
          <div className="input-group">
            <label>
              Map X%:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point2.mapX}
                onChange={(e) =>
                  handleInputChange("point2", "mapX", e.target.value)
                }
                placeholder="0-100"
              />
            </label>
            <label>
              Map Y%:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point2.mapY}
                onChange={(e) =>
                  handleInputChange("point2", "mapY", e.target.value)
                }
                placeholder="0-100"
              />
            </label>
            <label>
              World X:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point2.worldX}
                onChange={(e) =>
                  handleInputChange("point2", "worldX", e.target.value)
                }
                placeholder="World X coordinate"
              />
            </label>
            <label>
              World Y:
              <input
                type="number"
                step="0.01"
                value={calibrationPoints.point2.worldY}
                onChange={(e) =>
                  handleInputChange("point2", "worldY", e.target.value)
                }
                placeholder="World Y coordinate"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="calibration-actions">
        <button
          onClick={handleCalibrate}
          className="calibrate-button"
          disabled={!selectedMap}
        >
          Calibrate & Save
        </button>
        <button
          onClick={handleReset}
          className="reset-button"
          disabled={!selectedMap}
        >
          Reset
        </button>
      </div>

      {!selectedMap && (
        <div className="calibration-warning">
          Please select a map to configure calibration
        </div>
      )}
    </div>
  );
};

export default CalibrationPanel;
