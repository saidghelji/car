const mongoose = require('mongoose');

const vehicleInspectionSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    inspectionDate: {
      type: Date,
      required: true,
    },
    inspectorName: {
      type: String,
      required: true,
    },
    results: {
      type: String,
      required: true,
    },
    nextInspectionDate: {
      type: Date,
    },
    center: {
      type: String,
    },
    controlId: {
      type: String,
    },
    authorizationNumber: {
      type: String,
    },
    duration: {
      type: Number,
    },
    endDate: {
      type: Date,
    },
    price: {
      type: Number,
    },
    centerContact: {
      type: String,
    },
    observation: {
      type: String,
    },
    documents: [
      {
        name: { type: String },
        type: { type: String },
        size: { type: Number },
        url: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VehicleInspection', vehicleInspectionSchema);
