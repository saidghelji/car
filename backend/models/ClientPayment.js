const mongoose = require('mongoose');

const clientPaymentSchema = mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    paymentFor: {
      type: String,
      required: true,
      enum: ['contract', 'facture', 'accident'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: function() {
        return this.paymentFor === 'contract';
      },
    },
    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
      required: function() {
        return this.paymentFor === 'facture';
      },
    },
    accident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accident',
      required: function() {
        return this.paymentFor === 'accident';
      },
    },
    remainingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentType: {
      type: String,
      required: true,
      enum: ['espèce', 'chèque', 'carte bancaire', 'virement'],
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    documents: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClientPayment', clientPaymentSchema);
