import React, { useState, useRef } from "react";
import MapSelector, { maps } from "./components/MapSelector";
import MapViewer from "./components/MapViewer";
import PinList from "./components/PinList";
import CalibrationPanel from "./components/CalibrationPanel";
import "./App.css";
import CoordinateMapper from "./utils/coordinateMapper";
import { loadCalibration } from "./utils/calibrationStorage";

function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

const App = () => {
  const [selectedMap, setSelectedMap] = useState(null);
  const [pins, setPins] = useState([]);
  const [connectingPin, setConnectingPin] = useState(null);
  const [connections, setConnections] = useState([]);
  const coordMapperRef = useRef(new CoordinateMapper());
  const [luaImportText, setLuaImportText] = useState("");

  // Add this function to convert Lua table to JSON
  const luaToJson = (luaString) => {
    try {
      // Clean up Lua syntax to make it valid JSON
      luaString = luaString.trim();
      luaString = setCharAt(luaString, 0, "[");
      luaString = setCharAt(luaString, luaString.length - 1, "]");
      let jsonString = luaString
        // Replace Lua table syntax with JSON syntax
        .replace(/next"] = {/g, 'next"] = [')
        .replace(/--s*(.+)/g, "")
        .replace(/ }\n/g, "]")
        .replace(/\["/g, '"')
        .replace(/"] =/g, '":');

      // Parse the resulting JSON
      const data = JSON.parse(jsonString);

      // Transform the data to match your import format
      return data.map((point, idx) => {
        if (point.mapX && point.mapY) {
          return {
            id: idx,
            x: point.mapX,
            y: point.mapY,
            worldX: point.x,
            worldY: point.y,
            label: `Pin ${idx + 1}`,
            next: point.next || [],
            zone: point.zone,
          };
        }

        let { x: mapX, y: mapY } = coordMapperRef.current.worldToMap(
          point.x,
          point.y
        );
        let res = {
          id: idx,
          x: mapY,
          y: mapX,
          worldX: point.x,
          worldY: point.y,
          label: `Pin ${idx + 1}`,
          next: point.next || [],
          zone: point.zone,
        };
        console.log(res);
        return res;
      });
    } catch (error) {
      console.error("Error parsing Lua:", error);
      return null;
    }
  };

  const handleLuaImport = () => {
    try {
      const importedData = luaToJson(luaImportText);
      if (!importedData) {
        alert("Invalid Lua format");
        return;
      }

      // Create new pins
      const newPins = importedData.map((point) => ({
        id: point.id,
        x: point.x,
        y: point.y,
        worldX: point.worldY,
        worldY: point.worldX,
        label: point.label,
      }));

      // Create connections
      const newConnections = [];
      importedData.forEach((point, fromIndex) => {
        if (point.next) {
          point.next.forEach((toIndex) => {
            newConnections.push({
              id: Date.now() + Math.random(),
              from: newPins[fromIndex].id,
              to: newPins[toIndex - 1].id, // Subtract 1 because Lua arrays start at 1
            });
          });
        }
      });
      console.log(importedData);
      if (importedData[0]?.zone) {
        console.log("zone exist");
        const map = maps.find((m) => m.id === importedData[0].zone);
        if (map) {
          setSelectedMap(map);
        }
      }
      // Update state
      setPins(newPins);
      setConnections(newConnections);

      // Clear textarea
      setLuaImportText("");
    } catch (error) {
      console.error("Error importing Lua:", error);
      alert("Error importing data. Please check the format.");
    }
  };

  const handleCalibrate = (calibrationData) => {
    const { point1, point2 } = calibrationData;

    coordMapperRef.current.reset();
    coordMapperRef.current.addReferencePoint(
      point1.mapX,
      point1.mapY,
      point1.worldX,
      point1.worldY
    );
    coordMapperRef.current.addReferencePoint(
      point2.mapX,
      point2.mapY,
      point2.worldX,
      point2.worldY
    );

    // Update existing pins with world coordinates
    if (coordMapperRef.current.isCalibrated) {
      const updatedPins = pins.map((pin) => {
        const worldCoords = coordMapperRef.current.mapToWorld(pin.x, pin.y);
        return {
          ...pin,
          worldX: worldCoords.x,
          worldY: worldCoords.y,
          worldZ: 0,
        };
      });
      setPins(updatedPins);
    }
  };

  const handleCalibrationReset = () => {
    coordMapperRef.current.reset();
    // Remove world coordinates from pins
    const updatedPins = pins.map(({ worldX, worldY, ...pin }) => pin);
    setPins(updatedPins);
  };

  const exportData = () => {
    const exportData = pins.map((pin) => {
      // Find all connections where this pin is the 'from' pin
      const connectedPoints = connections
        .filter((conn) => conn.from === pin.id)
        .map((conn) => {
          // Find the connected pin and get its index
          const connectedPin = pins.find((p) => p.id === conn.to);
          return pins.indexOf(connectedPin) + 1;
        });

      return {
        mapX: pin.x,
        mapY: pin.y,
        // This is not wrong we need to swap coordinates
        x: pin.worldY,
        y: pin.worldX,
        z: pin.worldZ,
        zone: selectedMap?.id || "",
        next: connectedPoints,
      };
    });
    // Create and download the JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `map-data-${
      selectedMap?.id || "unknown"
    }-${Date.now()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // Create new pins with unique IDs
        const newPins = importedData.map((point, index) => ({
          id: Date.now() + index, // Generate unique IDs
          x: point.mapX,
          y: point.mapY,
          // this is not wrong, we need to swap coordinates
          worldX: point.y,
          worldY: point.x,
          worldZ: point.z,
          label: `Pin ${index + 1}`,
        }));

        // Create connections based on the 'next' arrays
        const newConnections = [];
        importedData.forEach((point, fromIndex) => {
          point.next.forEach((toIndex) => {
            newConnections.push({
              id: Date.now() + Math.random(),
              from: newPins[fromIndex].id,
              to: newPins[toIndex - 1].id,
            });
          });
        });

        // Update state
        setPins(newPins);
        setConnections(newConnections);

        // If zone is specified, try to select the corresponding map
        if (importedData[0]?.zone) {
          const map = maps.find((m) => m.id === importedData[0].zone);
          if (map) {
            setSelectedMap(map);
          }
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert("Error importing data. Please check the file format.");
      }
    };

    reader.readAsText(file);
  };

  const handleMapSelect = (map) => {
    setSelectedMap(map);
    setPins([]);
    setConnections([]);
    setConnectingPin(null);

    // Load calibration for selected map
    if (map) {
      const savedCalibration = loadCalibration(map.id);
      if (savedCalibration) {
        handleCalibrate(savedCalibration);
      } else {
        coordMapperRef.current.reset();
      }
    }
  };

  const handleMapClick = (e) => {
    if (!selectedMap) return;

    const rect = e.target.getBoundingClientRect();
    const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(2);
    const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(2);

    const newPin = {
      id: Date.now(),
      x: parseFloat(x),
      y: parseFloat(y),
      label: `Pin ${pins.length + 1}`,
    };

    setPins([...pins, newPin]);
  };

  const handlePinDelete = (pinId) => {
    setPins(pins.filter((pin) => pin.id !== pinId));
    setConnections(
      connections.filter((conn) => conn.from !== pinId && conn.to !== pinId)
    );
    if (connectingPin === pinId) {
      setConnectingPin(null);
    }
  };

  const handlePinClick = (pinId, e) => {
    e.stopPropagation(); // Prevent creating new pin

    if (connectingPin === null) {
      // Start connecting mode
      setConnectingPin(pinId);
    } else if (connectingPin === pinId) {
      // Cancel connecting mode
      setConnectingPin(null);
    } else {
      // Create connection
      const newConnection = {
        id: Date.now(),
        from: connectingPin,
        to: pinId,
      };

      const secondConnection = {
        id: Date.now() + 1,
        from: pinId,
        to: connectingPin,
      };

      // Check if connection already exists
      const connectionExists = connections.some(
        (conn) => conn.from === connectingPin && conn.to === pinId
      );

      if (!connectionExists) {
        setConnections([...connections, newConnection, secondConnection]);
      }
      // const secondConnectionExists = connections.some(
      //   (conn) => conn.from === pinId && conn.to === connectingPin
      // );

      // if (!secondConnectionExists) {
      //   setConnections([...connections, secondConnection]);
      // }

      setConnectingPin(null);
    }
  };

  const handleConnectionDelete = (connectionId) => {
    setConnections(connections.filter((conn) => conn.id !== connectionId));
  };

  // const handlePinClick = (pinId, event) => {
  //   if (connectingPin === null) {
  //     // Start connecting from this pin
  //     setConnectingPin(pinId);
  //   } else if (connectingPin !== pinId) {
  //     // Create two unidirectional connections
  //     const newConnection1 = {
  //       id: Date.now(),
  //       from: connectingPin,
  //       to: pinId,
  //     };

  //     const newConnection2 = {
  //       id: Date.now() + 1, // Ensure unique ID
  //       from: pinId,
  //       to: connectingPin,
  //     };

  //     setConnections([...connections, newConnection1, newConnection2]);
  //     setConnectingPin(null);
  //   } else {
  //     // Clicked the same pin twice, cancel connection
  //     setConnectingPin(null);
  //   }
  // };

  // // Keep original connection deletion (deletes single direction)
  // const handleConnectionDelete = (connectionId) => {
  //   setConnections(connections.filter((conn) => conn.id !== connectionId));
  // };

  return (
    <div className="app">
      <h1>Interactive Map Viewer</h1>
      <MapSelector onMapSelect={handleMapSelect} />
      <div className="import-export-controls">
        <button onClick={exportData}>Export Data</button>
        <label className="import-button">
          Import Data
          <input
            type="file"
            accept=".json"
            onChange={importData}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <CalibrationPanel
        onCalibrate={handleCalibrate}
        onReset={handleCalibrationReset}
        selectedMap={selectedMap}
      />
      <div className="content">
        <MapViewer
          selectedMap={selectedMap}
          pins={pins}
          connections={connections}
          connectingPin={connectingPin}
          onMapClick={handleMapClick}
          onPinClick={handlePinClick}
          mapperRef={coordMapperRef}
          setPins={setPins}
          onPinDelete={handlePinDelete}
        />
        <div className="sidebar">
          <PinList
            pins={pins}
            connections={connections}
            onPinDelete={handlePinDelete}
            onConnectionDelete={handleConnectionDelete}
          />
        </div>
      </div>
      <div className="lua-import">
        <textarea
          value={luaImportText}
          onChange={(e) => setLuaImportText(e.target.value)}
          placeholder="Paste Lua table here..."
          rows={10}
          style={{
            width: "100%",
            marginBottom: "10px",
            fontFamily: "monospace",
          }}
        />
        <button onClick={handleLuaImport}>Import Lua</button>
      </div>
    </div>
  );
};

export default App;
