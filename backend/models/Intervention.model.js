const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = {
  name: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  url: { type: DataTypes.STRING },
};

const Intervention = sequelize.define('Intervention', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleId: { type: DataTypes.UUID },
  description: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  cost: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' },
  type: { type: DataTypes.STRING, allowNull: false },
  observation: { type: DataTypes.TEXT },
  currentMileage: { type: DataTypes.INTEGER },
  nextMileage: { type: DataTypes.INTEGER },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'interventions' });

module.exports = Intervention;
