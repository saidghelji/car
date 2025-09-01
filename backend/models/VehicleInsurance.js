const mongoose = require('mongoose');

const vehicleInsuranceSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false, // Making customer optional
    },
    company: { // Renamed from insuranceProvider to match frontend
      type: String,
      required: true,
    },
    policyNumber: {
      type: String,
      required: true,
      unique: true,
    },
    operationDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    contactInfo: {
      type: String,
    },
    observation: {
      type: String,
    },
    attachments: [String],
    // You can add more fields here as needed, e.g., premium, claims, etc.
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VehicleInsurance', vehicleInsuranceSchema);
