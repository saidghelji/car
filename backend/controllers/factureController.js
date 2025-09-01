const asyncHandler = require('express-async-handler');
const Facture = require('../models/Facture');

// @desc    Get all invoices
// @route   GET /api/factures
// @access  Private
const getFactures = asyncHandler(async (req, res) => {
  const factures = await Facture.find({})
    .populate('client')
    .populate({
      path: 'contract',
      populate: {
        path: 'vehicle'
      }
    });
  res.status(200).json(factures);
});

// @desc    Get single invoice
// @route   GET /api/factures/:id
// @access  Private
const getFactureById = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id)
    .populate('client')
    .populate({
      path: 'contract',
      populate: {
        path: 'vehicle'
      }
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
  console.log('Received payload for createFacture:', req.body);
  const { client, contract, invoiceDate, dueDate, totalTTC, status, location, type, montantHT, tvaAmount, tvaPercentage, paymentType, amountPaid } = req.body;

  // Generate a unique invoice number (e.g., based on timestamp)
  const generatedInvoiceNumber = `INV-${Date.now()}`;

  const facture = new Facture({
    client,
    contract,
    invoiceDate,
    dueDate,
    totalTTC,
    status,
    invoiceNumber: generatedInvoiceNumber, // Use the auto-generated invoice number
    location,
    type,
    montantHT,
    tvaAmount,
    tvaPercentage,
    paymentType,
    amountPaid,
  });

  const createdFacture = await facture.save();
  res.status(201).json(createdFacture);
});

// @desc    Update an invoice
// @route   PUT /api/factures/:id
// @access  Private
const updateFacture = asyncHandler(async (req, res) => {
  console.log('Received payload for updateFacture:', req.body);
  const { client, contract, invoiceDate, dueDate, totalTTC, status, invoiceNumber, location, type, montantHT, tvaAmount, tvaPercentage, paymentType, amountPaid } = req.body;

  const facture = await Facture.findById(req.params.id);

  if (facture) {
    facture.client = client || facture.client; // Changed from customer
    facture.contract = contract || facture.contract;
    facture.invoiceDate = invoiceDate || facture.invoiceDate; // Changed from issueDate
    facture.dueDate = dueDate || facture.dueDate;
    facture.totalTTC = totalTTC || facture.totalTTC; // Changed from totalAmount
    facture.status = status || facture.status;
    facture.invoiceNumber = invoiceNumber || facture.invoiceNumber;
    facture.location = location || facture.location;
    facture.type = type || facture.type;
    facture.montantHT = montantHT || facture.montantHT;
    facture.tvaAmount = tvaAmount || facture.tvaAmount;
    facture.tvaPercentage = tvaPercentage || facture.tvaPercentage;
    facture.paymentType = paymentType || facture.paymentType;
    facture.amountPaid = amountPaid || facture.amountPaid;

    const updatedFacture = await facture.save();
    res.json(updatedFacture);
  } else {
    res.status(404);
    throw new Error('Facture not found');
  }
});

// @desc    Delete an invoice
// @route   DELETE /api/factures/:id
// @access  Private
const deleteFacture = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id);

  if (facture) {
    await facture.deleteOne();
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
