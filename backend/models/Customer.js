const mongoose = require('mongoose');

const CustomerDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true } // URL to the stored file
});

const CustomerSchema = new mongoose.Schema({
  // Conducteur Section
  civilite: { type: String, enum: ['M.', 'Mme', 'Mlle'], default: '' },
  nationalite: { type: String, default: '' },
  type: { type: String, enum: ['Particulier', 'Professionel'], default: 'Particulier' },
  listeNoire: { type: Boolean, default: false },
  nomFr: { type: String, required: true, trim: true },
  nomAr: { type: String, trim: true, default: '' },
  prenomFr: { type: String, required: true, trim: true },
  prenomAr: { type: String, trim: true, default: '' },
  dateNaissance: { type: String, default: '' }, // Stored as YYYY-MM-DD string
  age: { type: String, default: '' },
  lieuNaissance: { type: String, default: '' },
  ice: { type: String, trim: true, default: '' },

  // Pièce d'identité Section (CIN)
  cin: { type: String, required: true, trim: true, unique: true, sparse: true }, // sparse allows nulls for unique
  cinDelivreLe: { type: String, default: '' },
  cinDelivreA: { type: String, default: '' },
  cinValidite: { type: String, default: '' },

  // Pièce d'identité Section (Permis)
  numeroPermis: { type: String, required: true, trim: true, unique: true, sparse: true },
  permisDelivreLe: { type: String, default: '' },
  permisDelivreA: { type: String, default: '' },
  permisValidite: { type: String, default: '' },

  // Pièce d'identité Section (Passeport)
  numeroPasseport: { type: String, trim: true, unique: true, sparse: true, default: '' },
  passportDelivreLe: { type: String, default: '' },
  passportDelivreA: { type: String, default: '' },
  passportValidite: { type: String, default: '' },

  // Contact Section
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'],
    sparse: true
  },
  adresseFr: { type: String, trim: true, default: '' },
  ville: { type: String, trim: true, default: '' },
  adresseAr: { type: String, trim: true, default: '' },
  codePostal: { type: String, trim: true, default: '' },
  telephone: { type: String, trim: true, default: '' },
  telephone2: { type: String, trim: true, default: '' },
  fix: { type: String, trim: true, default: '' },
  fax: { type: String, trim: true, default: '' },
  remarque: { type: String, trim: true, default: '' },

  // Documents and Attachments (metadata only)
  documents: [CustomerDocumentSchema],

  // Additional fields from Customers.tsx (not directly from form, but part of customer data)
  totalRentals: { type: Number, default: 0 },
  status: { type: String, enum: ['Actif', 'Inactif'], default: 'Actif' },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Customer', CustomerSchema);
