const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer.model');
const Contract = require('../models/Contract.model');
const Reservation = require('../models/Reservation.model');
const ClientPayment = require('../models/ClientPayment.model');
const Facture = require('../models/Facture.model');
const Accident = require('../models/Accident.model');
const Infraction = require('../models/Infraction.model');
const fs = require('fs');
const path = require('path');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.findAll();
  res.status(200).json(customers);
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [
      { model: Contract, as: 'contracts' },
      { model: Reservation, as: 'reservations' },
      { model: ClientPayment, as: 'payments' },
      { model: Facture, as: 'factures' },
      { model: Accident, as: 'accidents' },
      { model: Infraction, as: 'infractions' },
    ],
  });

  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const newDocuments = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      newDocuments.push({
        name: file.originalname,
        url: `uploads/${file.filename}`, // Removed leading slash
        type: file.mimetype,
        size: file.size,
      });
    });
  }

  const createdCustomer = await Customer.create({ ...req.body, documents: newDocuments });
  res.status(201).json(createdCustomer);
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  let customer = await Customer.findByPk(req.params.id);

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Parse documentsToDelete from req.body
  let documentsToDelete = [];
  if (req.body.documentsToDelete) {
    try {
      documentsToDelete = JSON.parse(req.body.documentsToDelete);
    } catch (e) {
      console.error('Failed to parse documentsToDelete:', e);
      documentsToDelete = Array.isArray(req.body.documentsToDelete) ? req.body.documentsToDelete : [req.body.documentsToDelete];
    }
  }

  // Remove documents marked for deletion from the customer's existing documents
  let updatedDocuments = customer.documents.filter(doc => !documentsToDelete.includes(doc.url));

  // Delete files from the server's uploads directory
  for (const docUrl of documentsToDelete) {
    const filename = path.basename(docUrl);
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
  }

  // Add new documents from req.files
  if (req.files && req.files.length > 0) {
    const newUploadedDocuments = req.files.map(file => ({
      name: file.originalname,
      url: `uploads/${file.filename}`, // Removed leading slash
      type: file.mimetype,
      size: file.size,
    }));
    updatedDocuments = [...updatedDocuments, ...newUploadedDocuments];
  }

  // Update customer fields
  const updatedData = {};
  for (const key in req.body) {
    if (key !== 'documents' && key !== 'documentsToDelete') {
      updatedData[key] = req.body[key];
    }
  }
  updatedData.documents = updatedDocuments;

  await customer.update(updatedData);
  const updatedCustomer = await Customer.findByPk(req.params.id, {
    include: [
      { model: Contract, as: 'contracts' },
      { model: Reservation, as: 'reservations' },
      { model: ClientPayment, as: 'payments' },
      { model: Facture, as: 'factures' },
      { model: Accident, as: 'accidents' },
      { model: Infraction, as: 'infractions' },
    ],
  });
  res.json(updatedCustomer);
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);

  if (customer) {
    // Delete associated files from the server's uploads directory
    for (const doc of customer.documents) {
      const filename = path.basename(doc.url);
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

  await customer.destroy();
  res.json({ message: 'Customer removed' });
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
