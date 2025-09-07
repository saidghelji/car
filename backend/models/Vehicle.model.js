const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  chassisNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  imageUrl: { type: DataTypes.STRING, defaultValue: '' },
  temporaryPlate: { type: DataTypes.STRING, defaultValue: '' },
  licensePlate: { type: DataTypes.STRING, allowNull: false, unique: true },
  brand: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  circulationDate: { type: DataTypes.STRING },
  fuelType: { type: DataTypes.ENUM('diesel', 'essence', 'electrique', 'hybride'), defaultValue: 'essence' },
  fuelLevel: { type: DataTypes.ENUM('reserve', '1/4', '1/2', '3/4', 'plein'), defaultValue: 'plein' },
  mileage: { type: DataTypes.INTEGER, defaultValue: 0 },
  color: { type: DataTypes.STRING },
  colorCode: { type: DataTypes.STRING },
  rentalPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  nombreDePlaces: { type: DataTypes.INTEGER, defaultValue: 0 },
  nombreDeVitesses: { type: DataTypes.INTEGER, defaultValue: 0 },
  transmission: { type: DataTypes.ENUM('Manuelle', 'Automatique'), defaultValue: 'Manuelle' },
  observation: { type: DataTypes.STRING },
  equipment: { type: DataTypes.JSONB, defaultValue: {} },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
  autorisationDate: { type: DataTypes.DATE },
  autorisationValidity: { type: DataTypes.DATE },
  carteGriseDate: { type: DataTypes.DATE },
  carteGriseValidity: { type: DataTypes.DATE },
  statut: { type: DataTypes.ENUM('En parc', 'En circulation'), defaultValue: 'En parc' },
}, { timestamps: true, tableName: 'vehicles' });

module.exports = Vehicle;
