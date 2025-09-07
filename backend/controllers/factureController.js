const asyncHandler = require('express-async-handler');
const Facture = require('../models/Facture.model');
const { Customer, Contract, Vehicle } = require('../models');

// @desc    Get all invoices
// @route   GET /api/factures
// @access  Private
const getFactures = asyncHandler(async (req, res) => {
  const factures = await Facture.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: Customer, as: 'client' },
      { model: Contract, as: 'contract', include: [{ model: Vehicle, as: 'vehicle' }] },
    ],
  });
  res.status(200).json(factures);
});

// @desc    Get single invoice
// @route   GET /api/factures/:id
// @access  Private
const getFactureById = asyncHandler(async (req, res) => {
  const facture = await Facture.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'client' },
      { model: Contract, as: 'contract', include: [{ model: Vehicle, as: 'vehicle' }] },
    ],
  });
  if (facture) {
    res.json(facture);
  } else {
    res.status(404);
    throw new Error('Facture not found');
  }
});

// @desc    Create an invoice
// @route   POST /api/factures
// @access  Private
const createFacture = asyncHandler(async (req, res) => {
  const { clientId, contractId, invoiceDate, dueDate, totalTTC, status, location, type, montantHT, tvaAmount, tvaPercentage, paymentType, amountPaid } = req.body;

  const generatedInvoiceNumber = `INV-${Date.now()}`;

  const payload = { clientId, contractId, invoiceDate, dueDate, totalTTC, status, invoiceNumber: generatedInvoiceNumber, location, type, montantHT, tvaAmount, tvaPercentage, paymentType, amountPaid };
  console.log('Facture.create payload:', payload);
  let facture;
  try {
    facture = await Facture.create(payload);
  } catch (err) {
    console.error('Facture.create error:', err);
    const dbErr = err.parent || err.original || err;
    return res.status(500).json({ message: err.message, dbError: dbErr, payload });
  }

  const populated = await Facture.findByPk(facture.id, {
    include: [
      { model: Customer, as: 'client' },
      { model: Contract, as: 'contract', include: [{ model: Vehicle, as: 'vehicle' }] },
    ],
  });
  res.status(201).json(populated);
});

// @desc    Update an invoice
// @route   PUT /api/factures/:id
// @access  Private
const updateFacture = asyncHandler(async (req, res) => {
  const { clientId, contractId, invoiceDate, dueDate, totalTTC, status, invoiceNumber, location, type, montantHT, tvaAmount, tvaPercentage, paymentType, amountPaid } = req.body;

  const facture = await Facture.findByPk(req.params.id);
  if (facture) {
    const updated = {};
    if (clientId !== undefined) updated.clientId = clientId;
    if (contractId !== undefined) updated.contractId = contractId;
    if (invoiceDate !== undefined) updated.invoiceDate = invoiceDate;
    if (dueDate !== undefined) updated.dueDate = dueDate;
    if (totalTTC !== undefined) updated.totalTTC = totalTTC;
    if (status !== undefined) updated.status = status;
    if (invoiceNumber !== undefined) updated.invoiceNumber = invoiceNumber;
    if (location !== undefined) updated.location = location;
    if (type !== undefined) updated.type = type;
    if (montantHT !== undefined) updated.montantHT = montantHT;
    if (tvaAmount !== undefined) updated.tvaAmount = tvaAmount;
    if (tvaPercentage !== undefined) updated.tvaPercentage = tvaPercentage;
    if (paymentType !== undefined) updated.paymentType = paymentType;
    if (amountPaid !== undefined) updated.amountPaid = amountPaid;

    await facture.update(updated);
    const populated = await Facture.findByPk(facture.id, {
      include: [
        { model: Customer, as: 'client' },
        { model: Contract, as: 'contract', include: [{ model: Vehicle, as: 'vehicle' }] },
      ],
    });
    res.json(populated);
  } else {
    res.status(404);
    throw new Error('Facture not found');
  }
});

// @desc    Delete an invoice
// @route   DELETE /api/factures/:id
// @access  Private
const deleteFacture = asyncHandler(async (req, res) => {
  const facture = await Facture.findByPk(req.params.id);
  if (facture) {
    await facture.destroy();
    res.json({ message: 'Facture removed' });
  } else {
    res.status(404);
    throw new Error('Facture not found');
  }
});

module.exports = {
  getFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
};
