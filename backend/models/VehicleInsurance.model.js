const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const VehicleInsurance = sequelize.define('VehicleInsurance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleId: { type: DataTypes.UUID },
  customerId: { type: DataTypes.UUID },
  company: { type: DataTypes.STRING, allowNull: false },
  policyNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  operationDate: { type: DataTypes.DATE, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  contactInfo: { type: DataTypes.STRING },
  observation: { type: DataTypes.TEXT },
  attachments: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'vehicle_insurances' });

module.exports = VehicleInsurance;
