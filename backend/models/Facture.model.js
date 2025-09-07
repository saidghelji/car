const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Facture = sequelize.define('Facture', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  invoiceNumber: { type: DataTypes.STRING, unique: true },
  invoiceDate: { type: DataTypes.DATE, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  clientId: { type: DataTypes.UUID, allowNull: false },
  contractId: { type: DataTypes.UUID, allowNull: false },
  location: { type: DataTypes.STRING, defaultValue: '' },
  type: { type: DataTypes.ENUM('Professionel', 'Particulier'), defaultValue: 'Particulier' },
  montantHT: { type: DataTypes.FLOAT, defaultValue: 0 },
  tvaAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  tvaPercentage: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalTTC: { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentType: { type: DataTypes.ENUM('espèce', 'chèque', 'carte bancaire', 'virement'), defaultValue: 'espèce' },
  amountPaid: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('Pending', 'Paid', 'Cancelled'), defaultValue: 'Pending' },
}, { timestamps: true, tableName: 'factures' });

module.exports = Facture;
