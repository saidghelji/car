const mongoose = require('mongoose');


const EquipmentSubSchema = new mongoose.Schema({
  pneuDeSecours: { type: Boolean, default: false },
  posteRadio: { type: Boolean, default: false },
  cricManivelle: { type: Boolean, default: false },
  allumeCigare: { type: Boolean, default: false },
  jeuDe4Tapis: { type: Boolean, default: false },
  vetDeSecurite: { type: Boolean, default: false },
});

const ExtensionSubSchema = new mongoose.Schema({
  duration: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
});

const SecondDriverSubSchema = new mongoose.Schema({
  nom: { type: String, trim: true },
  nationalite: { type: String, trim: true },
  dateNaissance: { type: String }, // YYYY-MM-DD
  adresse: { type: String, trim: true },
  telephone: { type: String, trim: true },
  adresseEtranger: { type: String, trim: true },
  permisNumero: { type: String, trim: true },
  permisDelivreLe: { type: String }, // YYYY-MM-DD
  passeportCin: { type: String, trim: true },
  passeportDelivreLe: { type: String }, // YYYY-MM-DD
});

const ContractDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true } // URL to the stored file
});

const ContractSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  contractNumber: { type: String, unique: true, trim: true },
  contractDate: { type: String, required: true }, // YYYY-MM-DD
  departureDate: { type: String, required: true }, // YYYY-MM-DD
  departureTime: { type: String, default: '' }, // HH:mm
  returnDate: { type: String, required: true }, // YYYY-MM-DD
  contractLocation: { type: String, default: '' },
  duration: { type: Number, required: true, default: 0 },
  pickupLocation: { type: String, default: '' },
  returnLocation: { type: String, default: '' }, // Added for "Lieu Récupération"
  matricule: { type: String, required: true, trim: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  pricePerDay: { type: Number, required: true, default: 0 },
  startingKm: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  fuelLevel: { type: String, enum: ['reserve', '1/4', '1/2', '3/4', 'plein'], default: 'plein' },
  total: { type: Number, required: true, default: 0 },
  guarantee: { type: Number, default: 0 },
  paymentType: { type: String, enum: ['espece', 'cheque', 'carte_bancaire', 'virement'], default: 'espece' },
  advance: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  status: { type: String, enum: ['en_cours', 'retournee'], default: 'en_cours' },
  secondDriver: { type: SecondDriverSubSchema, default: null }, // Changed to embedded schema
  equipment: { type: EquipmentSubSchema, required: true },
  extension: { type: ExtensionSubSchema, default: null },
  piecesJointes: [ContractDocumentSchema],
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Contract', ContractSchema);
