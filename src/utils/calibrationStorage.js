export const saveCalibration = (mapId, calibrationData) => {
  try {
    const storedCalibrations = JSON.parse(
      localStorage.getItem("mapCalibrations") || "{}"
    );
    storedCalibrations[mapId] = calibrationData;
    localStorage.setItem("mapCalibrations", JSON.stringify(storedCalibrations));
  } catch (error) {
    console.error("Error saving calibration:", error);
  }
};

export const loadCalibration = (mapId) => {
  try {
    const storedCalibrations = JSON.parse(
      localStorage.getItem("mapCalibrations") || "{}"
    );
    return storedCalibrations[mapId] || null;
  } catch (error) {
    console.error("Error loading calibration:", error);
    return null;
  }
};

export const deleteCalibration = (mapId) => {
  try {
    const storedCalibrations = JSON.parse(
      localStorage.getItem("mapCalibrations") || "{}"
    );
    delete storedCalibrations[mapId];
    localStorage.setItem("mapCalibrations", JSON.stringify(storedCalibrations));
  } catch (error) {
    console.error("Error deleting calibration:", error);
  }
};

export const exportCalibrations = () => {
  const calibrations = localStorage.getItem("mapCalibrations");
  const blob = new Blob([calibrations], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "map-calibrations.json";
  a.click();
};

const validateCalibration = (calibration) => {
  // Add your validation logic here
  const { point1, point2 } = calibration;
  return (
    point1.mapX >= 0 &&
    point1.mapX <= 100 &&
    point1.mapY >= 0 &&
    point1.mapY <= 100 &&
    point2.mapX >= 0 &&
    point2.mapX <= 100 &&
    point2.mapY >= 0 &&
    point2.mapY <= 100
  );
};

const backupCalibrations = () => {
  const backup = localStorage.getItem("mapCalibrations");
  localStorage.setItem("mapCalibrationsBackup", backup);
};
