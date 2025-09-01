const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vehicle',
    },
    reservationNumber: {
      type: String,
      unique: true,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['en_cours', 'validee', 'annulee', 'fin_de_periode'],
      default: 'en_cours',
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    advance: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reservation', reservationSchema);
