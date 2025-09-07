const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const VehicleInspection = sequelize.define('VehicleInspection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleId: { type: DataTypes.UUID },
  inspectionDate: { type: DataTypes.DATE, allowNull: false },
  inspectorName: { type: DataTypes.STRING, allowNull: false },
  results: { type: DataTypes.TEXT, allowNull: false },
  nextInspectionDate: { type: DataTypes.DATE },
  center: { type: DataTypes.STRING },
  controlId: { type: DataTypes.STRING },
  authorizationNumber: { type: DataTypes.STRING },
  duration: { type: DataTypes.INTEGER },
  endDate: { type: DataTypes.DATE },
  price: { type: DataTypes.FLOAT },
  centerContact: { type: DataTypes.STRING },
  observation: { type: DataTypes.TEXT },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'vehicle_inspections' });

module.exports = VehicleInspection;
