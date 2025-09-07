const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Traite = sequelize.define('Traite', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleId: { type: DataTypes.UUID, allowNull: false },
  mois: { type: DataTypes.INTEGER, allowNull: false },
  annee: { type: DataTypes.INTEGER, allowNull: false },
  montant: { type: DataTypes.FLOAT, allowNull: false },
  datePaiement: { type: DataTypes.DATE },
  reference: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'traites' });

module.exports = Traite;
