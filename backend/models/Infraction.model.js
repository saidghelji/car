const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = {
  name: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
};

const Infraction = sequelize.define('Infraction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleId: { type: DataTypes.UUID },
  customerId: { type: DataTypes.UUID, allowNull: false },
  infractionDate: { type: DataTypes.DATE, allowNull: false },
  infractionNumber: { type: DataTypes.STRING, unique: true },
  timeInfraction: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  permis: { type: DataTypes.STRING },
  cin: { type: DataTypes.STRING },
  passeport: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('professional', 'particular'), defaultValue: 'particular' },
  societe: { type: DataTypes.STRING },
  telephone: { type: DataTypes.STRING },
  telephone2: { type: DataTypes.STRING },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
  description: { type: DataTypes.TEXT },
  amount: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('Pending', 'Paid', 'Disputed'), defaultValue: 'Pending' },
}, { timestamps: true, tableName: 'infractions' });

module.exports = Infraction;
