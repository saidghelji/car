const asyncHandler = require('express-async-handler');
const ClientPayment = require('../models/ClientPayment.model');
const { Customer, Contract, Facture, Accident } = require('../models');
const fs = require('fs');
const path = require('path');

// We'll use Sequelize includes now that associations are wired in models/index.js

// @desc    Get all client payments
// @route   GET /api/clientpayments
// @access  Private
const getClientPayments = asyncHandler(async (req, res) => {
  const clientPayments = await ClientPayment.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: Customer, as: 'client' },
      { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }] },
      { model: Facture, as: 'facture', include: [{ model: Customer, as: 'client' }] },
      { model: Accident, as: 'accident' },
    ],
  });
  res.status(200).json(clientPayments);
});

// @desc    Get single client payment
// @route   GET /api/clientpayments/:id
// @access  Private
const getClientPaymentById = asyncHandler(async (req, res) => {
  const clientPayment = await ClientPayment.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'client' },
      { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }] },
      { model: Facture, as: 'facture', include: [{ model: Customer, as: 'client' }] },
      { model: Accident, as: 'accident' },
    ],
  });
  if (clientPayment) res.json(clientPayment); else { res.status(404); throw new Error('Client payment not found'); }
});

// @desc    Create a client payment
// @route   POST /api/clientpayments
// @access  Private
const createClientPayment = asyncHandler(async (req, res) => {
  const {
    paymentDate,
    paymentFor,
    referenceNumber,
    clientId,
    contractId,
    factureId,
    accidentId,
    remainingAmount,
    paymentType,
    amountPaid,
  } = req.body;

  // Generate unique paymentNumber
  const currentYear = new Date().getFullYear();
  const latestPayment = await ClientPayment.findOne({ order: [['createdAt', 'DESC']] });
  let nextSequenceNumber = 1;

  if (latestPayment && latestPayment.paymentNumber) {
    const parts = latestPayment.paymentNumber.split('-');
    if (parts.length === 3 && parts[1] === String(currentYear)) {
      nextSequenceNumber = parseInt(parts[2]) + 1;
    }
  }

  const paymentNumber = `REG-${currentYear}-${String(nextSequenceNumber).padStart(3, '0')}`;

  const newDocuments = req.files ? req.files.map(file => ({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    url: file.path.replace(/\\/g, '/'),
  })) : [];

  const payload = {
    paymentNumber,
    paymentDate,
    paymentFor,
    referenceNumber,
    clientId,
    contractId,
    factureId,
    accidentId,
    remainingAmount,
    paymentType,
    amountPaid,
    documents: newDocuments,
  };
  console.log('ClientPayment.create payload:', payload);
  let clientPayment;
  try {
    clientPayment = await ClientPayment.create(payload);
  } catch (err) {
    console.error('ClientPayment.create error:', err);
    const dbErr = err.parent || err.original || err;
    return res.status(500).json({ message: err.message, dbError: dbErr, payload });
  }
  const populatedPayment = await ClientPayment.findByPk(clientPayment.id, {
    include: [
      { model: Customer, as: 'client' },
      { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }] },
      { model: Facture, as: 'facture', include: [{ model: Customer, as: 'client' }] },
      { model: Accident, as: 'accident' },
    ],
  });
  res.status(201).json(populatedPayment);
});

// @desc    Update a client payment
// @route   PUT /api/clientpayments/:id
// @access  Private
const updateClientPayment = asyncHandler(async (req, res) => {
  const {
    paymentNumber,
    paymentDate,
    paymentFor,
    referenceNumber,
    clientId,
    contractId,
    factureId,
    accidentId,
    remainingAmount,
    paymentType,
    amountPaid,
    existingDocuments: existingDocumentsString,
  } = req.body;

  const clientPayment = await ClientPayment.findByPk(req.params.id);

  if (clientPayment) {
    const updatedData = {};
    if (paymentNumber !== undefined) updatedData.paymentNumber = paymentNumber;
    if (paymentDate !== undefined) updatedData.paymentDate = paymentDate;
    if (paymentFor !== undefined) updatedData.paymentFor = paymentFor;
    if (referenceNumber !== undefined) updatedData.referenceNumber = referenceNumber;
    if (clientId !== undefined) updatedData.clientId = clientId;
    if (contractId !== undefined) updatedData.contractId = contractId;
    if (factureId !== undefined) updatedData.factureId = factureId;
    if (accidentId !== undefined) updatedData.accidentId = accidentId;
    if (remainingAmount !== undefined) updatedData.remainingAmount = remainingAmount;
    if (paymentType !== undefined) updatedData.paymentType = paymentType;
    if (amountPaid !== undefined) updatedData.amountPaid = amountPaid;

    let existingDocuments = [];
    if (existingDocumentsString) {
      try {
        existingDocuments = JSON.parse(existingDocumentsString);
      } catch (e) {
        console.error("Error parsing existing documents:", e);
        existingDocuments = [];
      }
    }

    const newDocuments = req.files ? req.files.map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: file.path.replace(/\\/g, '/'),
    })) : [];

    updatedData.documents = [...existingDocuments, ...newDocuments];

    await clientPayment.update(updatedData);
    const populatedPayment = await ClientPayment.findByPk(clientPayment.id, {
      include: [
        { model: Customer, as: 'client' },
        { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }] },
        { model: Facture, as: 'facture', include: [{ model: Customer, as: 'client' }] },
        { model: Accident, as: 'accident' },
      ],
    });
    res.json(populatedPayment);
  } else {
    res.status(404);
    throw new Error('Client payment not found');
  }
});

// @desc    Delete a client payment
// @route   DELETE /api/clientpayments/:id
// @access  Private
const deleteClientPayment = asyncHandler(async (req, res) => {
  const clientPayment = await ClientPayment.findByPk(req.params.id);

  if (clientPayment) {
    await clientPayment.destroy();
    res.json({ message: 'Client payment removed' });
  } else {
    res.status(404);
    throw new Error('Client payment not found');
  }
});

// @desc    Remove a document from a client payment
// @route   DELETE /api/clientpayments/:id/documents
// @access  Private
const removePaymentDocument = asyncHandler(async (req, res) => {
  const { documentUrl } = req.body;
  const clientPayment = await ClientPayment.findByPk(req.params.id);

  if (clientPayment) {
    let filePathToDelete = '';
    const documentIndex = clientPayment.documents.findIndex(doc => doc.url === documentUrl);

    if (documentIndex > -1) {
      filePathToDelete = clientPayment.documents[documentIndex].url;
      const docs = [...clientPayment.documents];
      docs.splice(documentIndex, 1);
      await clientPayment.update({ documents: docs });
    } else {
      res.status(404);
      throw new Error('Document not found in this payment record');
    }

    if (filePathToDelete) {
      const fullPath = path.join(__dirname, '..', '..', filePathToDelete);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Error deleting file ${fullPath}:`, err);
        }
      });
    }

    const refreshed = await ClientPayment.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'client' },
        { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }] },
        { model: Facture, as: 'facture', include: [{ model: Customer, as: 'client' }] },
        { model: Accident, as: 'accident' },
      ],
    });
    res.json({ message: 'Document removed successfully', clientPayment: refreshed });
  } else {
    res.status(404);
    throw new Error('Client payment not found');
  }
});

module.exports = {
  getClientPayments,
  getClientPaymentById,
  createClientPayment,
  updateClientPayment,
  deleteClientPayment,
  removePaymentDocument,
};
