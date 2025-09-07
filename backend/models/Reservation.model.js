const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  vehicleId: { type: DataTypes.UUID, allowNull: false },
  reservationNumber: { type: DataTypes.STRING, unique: true },
  reservationDate: { type: DataTypes.DATE, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('en_cours', 'validee', 'annulee', 'fin_de_periode'), defaultValue: 'en_cours' },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  advance: { type: DataTypes.FLOAT, defaultValue: 0 },
  notes: { type: DataTypes.STRING },
}, { timestamps: true, tableName: 'reservations' });

module.exports = Reservation;
