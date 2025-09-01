const asyncHandler = require('express-async-handler');
const Charge = require('../models/Charge');

const mapChargeToFrontend = (charge) => ({
  _id: charge._id,
  motif: charge.name,
  montant: charge.amount,
  observation: charge.description,
  date: charge.date,
  attachments: charge.attachments,
  createdAt: charge.createdAt,
  updatedAt: charge.updatedAt,
});

// @desc    Get all charges
// @route   GET /api/charges
// @access  Private
const getCharges = asyncHandler(async (req, res) => {
  const charges = await Charge.find({});
  res.status(200).json(charges.map(mapChargeToFrontend));
});

// @desc    Get single charge
// @route   GET /api/charges/:id
// @access  Private
const getChargeById = asyncHandler(async (req, res) => {
  const charge = await Charge.findById(req.params.id);

  if (charge) {
    res.json(mapChargeToFrontend(charge));
  } else {
    res.status(404);
    throw new Error('Charge not found');
  }
});

// @desc    Create a charge
// @route   POST /api/charges
// @access  Private
const createCharge = asyncHandler(async (req, res) => {
  const { motif, montant, observation, date } = req.body;
  const attachments = req.files ? req.files.map((file) => file.path) : [];

  const charge = new Charge({
    name: motif,
    amount: montant,
    description: observation,
    date,
    attachments,
  });

  const createdCharge = await charge.save();
  res.status(201).json(mapChargeToFrontend(createdCharge));
});

// @desc    Update a charge
// @route   PUT /api/charges/:id
// @access  Private
const updateCharge = asyncHandler(async (req, res) => {
  const { motif, montant, observation, date, existingDocuments } = req.body;

  const charge = await Charge.findById(req.params.id);

  if (charge) {
    charge.name = motif || charge.name;
    charge.amount = montant || charge.amount;
    charge.description = observation || charge.description;
    charge.date = date || charge.date;

    const newAttachments = req.files ? req.files.map((file) => file.path) : [];
    const updatedAttachments = existingDocuments
      ? JSON.parse(existingDocuments).map((doc) => doc.url)
      : [];

    charge.attachments = [...updatedAttachments, ...newAttachments];

    const updatedCharge = await charge.save();
    res.json(mapChargeToFrontend(updatedCharge));
  } else {
    res.status(404);
    throw new Error('Charge not found');
  }
});

// @desc    Delete a charge
// @route   DELETE /api/charges/:id
// @access  Private
const deleteCharge = asyncHandler(async (req, res) => {
  const charge = await Charge.findById(req.params.id);

  if (charge) {
    await charge.deleteOne();
    res.json({ message: 'Charge removed' });
  } else {
    res.status(404);
    throw new Error('Charge not found');
  }
});

module.exports = {
  getCharges,
  getChargeById,
  createCharge,
  updateCharge,
  deleteCharge,
};
