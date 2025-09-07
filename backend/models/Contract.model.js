const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Contract = sequelize.define('Contract', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  clientId: { type: DataTypes.UUID, allowNull: false },
  contractNumber: { type: DataTypes.STRING, unique: true },
  contractDate: { type: DataTypes.STRING, allowNull: false },
  departureDate: { type: DataTypes.STRING, allowNull: false },
  departureTime: { type: DataTypes.STRING },
  returnDate: { type: DataTypes.STRING, allowNull: false },
  contractLocation: { type: DataTypes.STRING },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 },
  pickupLocation: { type: DataTypes.STRING },
  returnLocation: { type: DataTypes.STRING },
  matricule: { type: DataTypes.STRING, allowNull: false },
  vehicleId: { type: DataTypes.UUID, allowNull: false },
  pricePerDay: { type: DataTypes.FLOAT, defaultValue: 0 },
  startingKm: { type: DataTypes.INTEGER, defaultValue: 0 },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  fuelLevel: { type: DataTypes.ENUM('reserve', '1/4', '1/2', '3/4', 'plein'), defaultValue: 'plein' },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  guarantee: { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentType: { type: DataTypes.ENUM('espece', 'cheque', 'carte_bancaire', 'virement'), defaultValue: 'espece' },
  advance: { type: DataTypes.FLOAT, defaultValue: 0 },
  remaining: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('en_cours', 'retournee'), defaultValue: 'en_cours' },
  secondDriver: { type: DataTypes.JSONB },
  equipment: { type: DataTypes.JSONB },
  extension: { type: DataTypes.JSONB },
  piecesJointes: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'contracts' });

module.exports = Contract;
