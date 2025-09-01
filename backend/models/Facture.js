const mongoose = require('mongoose');

const factureSchema = mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
      // invoiceNumber is auto-generated, so it's not required at creation
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Contract',
    },
    location: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['Professionel', 'Particulier'],
      default: 'Particulier',
    },
    montantHT: {
      type: Number,
      required: true,
      default: 0,
    },
    tvaAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    tvaPercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTTC: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentType: {
      type: String,
      enum: ['espèce', 'chèque', 'carte bancaire', 'virement'],
      default: 'espèce',
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Facture', factureSchema);
