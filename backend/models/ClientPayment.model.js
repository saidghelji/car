const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = {
  name: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  url: { type: DataTypes.STRING },
};

const ClientPayment = sequelize.define('ClientPayment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  paymentNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  paymentDate: { type: DataTypes.DATE, allowNull: false },
  paymentFor: { type: DataTypes.ENUM('contract', 'facture', 'accident'), allowNull: false },
  clientId: { type: DataTypes.UUID, allowNull: false },
  contractId: { type: DataTypes.UUID },
  factureId: { type: DataTypes.UUID },
  accidentId: { type: DataTypes.UUID },
  remainingAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentType: { type: DataTypes.ENUM('espèce', 'chèque', 'carte bancaire', 'virement') },
  amountPaid: { type: DataTypes.FLOAT, allowNull: false },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'client_payments' });

module.exports = ClientPayment;
