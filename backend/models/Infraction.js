const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number },
});

const infractionSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Vehicle',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    infractionDate: {
      type: Date,
      required: true,
    },
    infractionNumber: {
      type: String,
      unique: true,
    },
    timeInfraction: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    permis: {
      type: String,
    },
    cin: {
      type: String,
    },
    passeport: {
      type: String,
    },
    type: {
      type: String,
      enum: ['professional', 'particular'],
      default: 'particular',
    },
    societe: {
      type: String,
    },
    telephone: {
      type: String,
    },
    telephone2: {
      type: String,
    },
    documents: [documentSchema],
    description: {
      type: String,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Disputed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Infraction', infractionSchema);
