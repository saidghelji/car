const asyncHandler = require('express-async-handler');
const ClientPayment = require('../models/ClientPayment');
const fs = require('fs');
const path = require('path');

// @desc    Get all client payments
// @route   GET /api/clientpayments
// @access  Private
const getClientPayments = asyncHandler(async (req, res) => {
  const clientPayments = await ClientPayment.find({})
    .populate('client')
    .populate({
      path: 'contract',
      populate: {
        path: 'client'
      }
    })
    .populate({
      path: 'facture',
      populate: {
        path: 'client'
      }
    })
    .populate('accident');
  res.status(200).json(clientPayments);
});

// @desc    Get single client payment
// @route   GET /api/clientpayments/:id
// @access  Private
const getClientPaymentById = asyncHandler(async (req, res) => {
  const clientPayment = await ClientPayment.findById(req.params.id).populate('client');

  if (clientPayment) {
    res.json(clientPayment);
  } else {
    res.status(404);
    throw new Error('Client payment not found');
  }
});

// @desc    Create a client payment
// @route   POST /api/clientpayments
// @access  Private
const createClientPayment = asyncHandler(async (req, res) => {
  const {
    paymentDate,
    paymentFor,
    referenceNumber,
    client,
    contract,
    facture,
    accident,
    remainingAmount,
    paymentType,
    amountPaid,
  } = req.body;

  // Generate unique paymentNumber
  const currentYear = new Date().getFullYear();
  const latestPayment = await ClientPayment.findOne({}, {}, { sort: { 'createdAt': -1 } });
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

  const clientPayment = new ClientPayment({
    paymentNumber, // Use the generated payment number
    paymentDate,
    paymentFor,
    referenceNumber,
    client,
    contract,
    facture,
    accident,
    remainingAmount,
    paymentType,
    amountPaid,
    documents: newDocuments,
  });

  const createdClientPayment = await clientPayment.save();
  const populatedPayment = await ClientPayment.findById(createdClientPayment._id)
    .populate('client')
    .populate({
      path: 'contract',
      populate: {
        path: 'client'
      }
    })
    .populate({
      path: 'facture',
      populate: {
        path: 'client'
      }
    })
    .populate('accident');
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
    client,
    contract,
    facture,
    accident,
    remainingAmount,
    paymentType,
    amountPaid,
    existingDocuments: existingDocumentsString,
  } = req.body;

  const clientPayment = await ClientPayment.findById(req.params.id);

  if (clientPayment) {
    if (paymentNumber !== undefined) clientPayment.paymentNumber = paymentNumber;
    if (paymentDate !== undefined) clientPayment.paymentDate = paymentDate;
    if (paymentFor !== undefined) clientPayment.paymentFor = paymentFor;
    if (referenceNumber !== undefined) clientPayment.referenceNumber = referenceNumber;
    if (client !== undefined) clientPayment.client = client;
    if (contract !== undefined) clientPayment.contract = contract;
    if (facture !== undefined) clientPayment.facture = facture;
    if (accident !== undefined) clientPayment.accident = accident;
    if (remainingAmount !== undefined) clientPayment.remainingAmount = remainingAmount;
    if (paymentType !== undefined) clientPayment.paymentType = paymentType;
    if (amountPaid !== undefined) clientPayment.amountPaid = amountPaid;

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

    clientPayment.documents = [...existingDocuments, ...newDocuments];

    const updatedClientPayment = await clientPayment.save();
    const populatedPayment = await ClientPayment.findById(updatedClientPayment._id)
      .populate('client')
      .populate({
        path: 'contract',
        populate: {
          path: 'client'
        }
      })
      .populate({
        path: 'facture',
        populate: {
          path: 'client'
        }
      })
      .populate('accident');
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
  const clientPayment = await ClientPayment.findById(req.params.id);

  if (clientPayment) {
    await clientPayment.deleteOne();
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
  const clientPayment = await ClientPayment.findById(req.params.id);

  if (clientPayment) {
    let filePathToDelete = '';
    const documentIndex = clientPayment.documents.findIndex(doc => doc.url === documentUrl);

    if (documentIndex > -1) {
      filePathToDelete = clientPayment.documents[documentIndex].url;
      clientPayment.documents.splice(documentIndex, 1);
    } else {
      res.status(404);
      throw new Error('Document not found in this payment record');
    }

    await clientPayment.save();

    if (filePathToDelete) {
      const fullPath = path.join(__dirname, '..', '..', filePathToDelete);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Error deleting file ${fullPath}:`, err);
        }
      });
    }

    res.json({ message: 'Document removed successfully', clientPayment });
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
