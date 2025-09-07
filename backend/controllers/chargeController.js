const asyncHandler = require('express-async-handler');
const Charge = require('../models/Charge.model');

const mapChargeToFrontend = (charge) => ({
  id: charge.id,
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
  const charges = await Charge.findAll({ order: [['createdAt', 'DESC']] });
  res.status(200).json(charges.map(c => mapChargeToFrontend(c.toJSON())));
});

// @desc    Get single charge
// @route   GET /api/charges/:id
// @access  Private
const getChargeById = asyncHandler(async (req, res) => {
  const charge = await Charge.findByPk(req.params.id);
  if (charge) {
    res.json(mapChargeToFrontend(charge.toJSON()));
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
  const attachments = req.files ? req.files.map((file) => file.path.replace(/\\/g, '/')) : [];

  const created = await Charge.create({ name: motif, amount: montant, description: observation, date, attachments });
  const populated = await Charge.findByPk(created.id);
  res.status(201).json(mapChargeToFrontend(populated.toJSON()));
});

// @desc    Update a charge
// @route   PUT /api/charges/:id
// @access  Private
const updateCharge = asyncHandler(async (req, res) => {
  const { motif, montant, observation, date, existingDocuments } = req.body;

  const charge = await Charge.findByPk(req.params.id);
  if (!charge) {
    res.status(404);
    throw new Error('Charge not found');
  }

  const updatedData = {};
  if (motif !== undefined) updatedData.name = motif;
  if (montant !== undefined) updatedData.amount = montant;
  if (observation !== undefined) updatedData.description = observation;
  if (date !== undefined) updatedData.date = date;

  const newAttachments = req.files ? req.files.map((file) => file.path.replace(/\\/g, '/')) : [];
  const updatedAttachments = existingDocuments ? JSON.parse(existingDocuments).map((doc) => doc.url) : [];
  updatedData.attachments = [...updatedAttachments, ...newAttachments];

  await charge.update(updatedData);
  const updatedCharge = await Charge.findByPk(req.params.id);
  res.json(mapChargeToFrontend(updatedCharge.toJSON()));
});

// @desc    Delete a charge
// @route   DELETE /api/charges/:id
// @access  Private
const deleteCharge = asyncHandler(async (req, res) => {
  const charge = await Charge.findByPk(req.params.id);

  if (charge) {
    await charge.destroy();
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
