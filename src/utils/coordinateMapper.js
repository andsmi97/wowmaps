class CoordinateMapper {
  constructor() {
    this.referencePoints = [];
    this.isCalibrated = false;
    this.scaleX = 0;
    this.scaleY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  addReferencePoint(mapX, mapY, worldX, worldY) {
    if (this.referencePoints.length >= 2) {
      this.referencePoints = [];
      this.isCalibrated = false;
    }

    this.referencePoints.push({ mapX, mapY, worldX, worldY });

    if (this.referencePoints.length === 2) {
      this.calibrate();
    }
  }

  calibrate() {
    const [p1, p2] = this.referencePoints;

    // Calculate scale factors
    const deltaMapX = p2.mapX - p1.mapX;
    const deltaMapY = p2.mapY - p1.mapY;
    const deltaWorldX = p2.worldX - p1.worldX;
    const deltaWorldY = p2.worldY - p1.worldY;

    this.scaleX = deltaWorldX / deltaMapX;
    this.scaleY = deltaWorldY / deltaMapY;
    // Calculate offsets
    this.offsetX = p1.worldX - p1.mapX * this.scaleX;
    this.offsetY = p1.worldY - p1.mapY * this.scaleY;

    this.isCalibrated = true;
  }

  mapToWorld(mapX, mapY) {
    if (!this.isCalibrated) {
      throw new Error("Mapper not calibrated. Need two reference points.");
    }

    const worldX = mapX * this.scaleX + this.offsetX;
    const worldY = mapY * this.scaleY + this.offsetY;

    return {
      x: Math.round(worldX),
      y: Math.round(worldY),
    };
  }

  worldToMap(worldX, worldY) {
    if (!this.isCalibrated) {
      throw new Error("Mapper not calibrated. Need two reference points.");
    }
    console.log(worldX, "world X");
    console.log(worldY, "world Y");
    console.log(this.offsetX, "offset X ");
    console.log(this.offsetY, "offset Y");
    console.log(this.scaleX, "scale X");
    console.log(this.scaleY, "scale Y");
    const mapX = (worldX - this.offsetY) / this.scaleY;
    const mapY = (worldY - this.offsetX) / this.scaleX;

    return {
      x: Math.round(mapX * 10) / 10,
      y: Math.round(mapY * 10) / 10,
    };
  }

  reset() {
    this.referencePoints = [];
    this.isCalibrated = false;
    this.scaleX = 0;
    this.scaleY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  getCalibrationStatus() {
    return {
      isCalibrated: this.isCalibrated,
      pointsNeeded: 2 - this.referencePoints.length,
      referencePoints: [...this.referencePoints],
    };
  }
}

export default CoordinateMapper;
