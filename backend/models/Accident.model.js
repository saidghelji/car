const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = {
  name: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
};

const Accident = sequelize.define('Accident', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  contractId: { type: DataTypes.UUID, allowNull: false },
  numeroContrat: { type: DataTypes.STRING, allowNull: false },
  dateSortie: { type: DataTypes.STRING, allowNull: false },
  clientId: { type: DataTypes.UUID, allowNull: false },
  clientNom: { type: DataTypes.STRING, allowNull: false },
  dateRetour: { type: DataTypes.STRING, allowNull: false },
  matricule: { type: DataTypes.STRING, allowNull: false },
  vehicleId: { type: DataTypes.UUID, allowNull: false },
  dateAccident: { type: DataTypes.STRING, allowNull: false },
  heureAccident: { type: DataTypes.STRING, allowNull: false },
  lieuAccident: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  etat: { type: DataTypes.ENUM('expertise', 'en_cours', 'repare'), defaultValue: 'expertise' },
  dateEntreeGarage: { type: DataTypes.STRING },
  dateReparation: { type: DataTypes.STRING },
  montantReparation: { type: DataTypes.FLOAT, defaultValue: 0 },
  fraisClient: { type: DataTypes.FLOAT, defaultValue: 0 },
  indemniteAssurance: { type: DataTypes.FLOAT, defaultValue: 0 },
  avance: { type: DataTypes.FLOAT, defaultValue: 0 },
  piecesJointes: { type: DataTypes.JSONB, defaultValue: [] },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
}, { timestamps: true, tableName: 'accidents' });

module.exports = Accident;
