const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = {
  name: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  url: { type: DataTypes.STRING },
};

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  civilite: { type: DataTypes.STRING },
  nationalite: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('Particulier', 'Professionel'), defaultValue: 'Particulier' },
  listeNoire: { type: DataTypes.BOOLEAN, defaultValue: false },
  nomFr: { type: DataTypes.STRING, allowNull: false },
  nomAr: { type: DataTypes.STRING },
  prenomFr: { type: DataTypes.STRING, allowNull: false },
  prenomAr: { type: DataTypes.STRING },
  dateNaissance: { type: DataTypes.STRING },
  age: { type: DataTypes.STRING },
  lieuNaissance: { type: DataTypes.STRING },
  ice: { type: DataTypes.STRING },
  cin: { type: DataTypes.STRING, unique: true },
  cinDelivreLe: { type: DataTypes.STRING },
  cinDelivreA: { type: DataTypes.STRING },
  cinValidite: { type: DataTypes.STRING },
  numeroPermis: { type: DataTypes.STRING, unique: true },
  permisDelivreLe: { type: DataTypes.STRING },
  permisDelivreA: { type: DataTypes.STRING },
  permisValidite: { type: DataTypes.STRING },
  numeroPasseport: { type: DataTypes.STRING, unique: true },
  passportDelivreLe: { type: DataTypes.STRING },
  passportDelivreA: { type: DataTypes.STRING },
  passportValidite: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  adresseFr: { type: DataTypes.STRING },
  ville: { type: DataTypes.STRING },
  adresseAr: { type: DataTypes.STRING },
  codePostal: { type: DataTypes.STRING },
  telephone: { type: DataTypes.STRING },
  telephone2: { type: DataTypes.STRING },
  fix: { type: DataTypes.STRING },
  fax: { type: DataTypes.STRING },
  remarque: { type: DataTypes.STRING },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
  totalRentals: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('Actif', 'Inactif'), defaultValue: 'Actif' },
}, {
  timestamps: true,
  tableName: 'customers',
});

module.exports = Customer;
