const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const interventionSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Vehicle',
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'Pending',
    },
    type: {
      type: String,
      required: true,
    },
    observation: {
      type: String,
    },
    currentMileage: {
      type: Number,
    },
    nextMileage: {
      type: Number,
    },
    documents: [documentSchema], // Use the explicit sub-schema
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Intervention', interventionSchema);
