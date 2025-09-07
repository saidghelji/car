const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Charge = sequelize.define('Charge', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE },
  attachments: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'charges' });

module.exports = Charge;
