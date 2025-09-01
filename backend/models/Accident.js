const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
});

const accidentSchema = new mongoose.Schema({
  contrat: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  numeroContrat: { type: String, required: true },
  dateSortie: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  clientNom: { type: String, required: true },
  dateRetour: { type: String, required: true },
  matricule: { type: String, required: true },
  vehicule: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  dateAccident: { type: String, required: true },
  heureAccident: { type: String, required: true },
  lieuAccident: { type: String, required: true },
  description: { type: String, default: '' },
  etat: { type: String, enum: ['expertise', 'en_cours', 'repare'], default: 'expertise' },
  dateEntreeGarage: { type: String, default: null },
  dateReparation: { type: String, default: null },
  montantReparation: { type: Number, default: 0 },
  fraisClient: { type: Number, default: 0 },
  indemniteAssurance: { type: Number, default: 0 },
  avance: { type: Number, default: 0 },
  piecesJointes: [{ type: String }],
  documents: [DocumentSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Accident', accidentSchema);
