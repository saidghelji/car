const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
  name: String,
  url: String,
  type: String,
  size: Number,
});

const traiteSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vehicle',
    },
    mois: {
      type: Number,
      required: true,
    },
    annee: {
      type: Number,
      required: true,
    },
    montant: {
      type: Number,
      required: true,
    },
    datePaiement: {
      type: Date,
    },
    reference: {
      type: String,
    },
    notes: {
      type: String,
    },
    documents: [documentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Traite', traiteSchema);
