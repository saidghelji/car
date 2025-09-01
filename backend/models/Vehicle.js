const mongoose = require('mongoose');

const VehicleEquipmentSchema = new mongoose.Schema({
  pneuDeSecours: { type: Boolean, default: false },
  posteRadio: { type: Boolean, default: false },
  cricManivelle: { type: Boolean, default: false },
  allumeCigare: { type: Boolean, default: false },
  jeuDe4Tapis: { type: Boolean, default: false },
  vetDeSecurite: { type: Boolean, default: false },
});

const VehicleDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true } // URL to the stored file
});

const VehicleSchema = new mongoose.Schema({
  chassisNumber: { type: String, required: true, unique: true, trim: true },
  imageUrl: { type: String, default: '' },
  temporaryPlate: { type: String, trim: true, default: '' }, // Matricule WW
  licensePlate: { type: String, required: true, unique: true, trim: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  circulationDate: { type: String, default: '' }, // Stored as YYYY-MM-DD string
  fuelType: { type: String, enum: ['diesel', 'essence', 'electrique', 'hybride'], default: 'essence' },
  fuelLevel: { type: String, enum: ['reserve', '1/4', '1/2', '3/4', 'plein'], default: 'plein' },
  mileage: { type: Number, required: true, default: 0 },
  color: { type: String, trim: true, default: '' },
  colorCode: { type: String, trim: true, default: '' },
  rentalPrice: { type: Number, required: true, default: 0 },
  nombreDePlaces: { type: Number, default: 0 },
  nombreDeVitesses: { type: Number, default: 0 },
  transmission: { type: String, enum: ['Manuelle', 'Automatique'], default: '' }, // Added field
  observation: { type: String, trim: true, default: '' },
  equipment: VehicleEquipmentSchema,
  documents: [VehicleDocumentSchema],
  autorisationDate: { type: Date },
  autorisationValidity: { type: Date },
  carteGriseDate: { type: Date },
  carteGriseValidity: { type: Date },
  statut: { type: String, enum: ['En parc', 'En circulation'], default: 'En parc' },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
