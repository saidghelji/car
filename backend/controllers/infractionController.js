const asyncHandler = require('express-async-handler');
const Infraction = require('../models/Infraction');
const mongoose = require('mongoose'); // Add this line
const path = require('path');
const fs = require('fs');

// @desc    Get all infractions
// @route   GET /api/infractions
// @access  Private
const getInfractions = asyncHandler(async (req, res) => {
  const infractions = await Infraction.find({}).populate('vehicle').populate('customer');
  res.status(200).json(infractions);
});

// @desc    Get single infraction
// @route   GET /api/infractions/:id
// @access  Private
const getInfractionById = asyncHandler(async (req, res) => {
  const infraction = await Infraction.findById(req.params.id).populate('vehicle').populate('customer');

  if (infraction) {
    res.json(infraction);
  } else {
    res.status(404);
    throw new Error('Infraction not found');
  }
});

// @desc    Create an infraction
// @route   POST /api/infractions
// @access  Private
const createInfraction = asyncHandler(async (req, res) => {
  console.log('Received request body:', req.body);
  console.log('Received files:', req.files);

  const { 
    vehicle: vehicleId, customer: customerId, infractionDate, timeInfraction, 
    location, date, permis, cin, passeport, type, societe, 
    telephone, telephone2, description, amount, status, infractionNumber // Remove infractionNumber from here
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(customerId)) {
    res.status(400);
    throw new Error('Invalid Vehicle or Customer ID');
  }

  const parsedDateInfraction = new Date(infractionDate);
  const parsedFaitLe = new Date(date);

  const newDocuments = req.files ? req.files.map(file => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`, // Adjust path as per your file serving setup
    type: file.mimetype,
    size: file.size,
  })) : [];

  const Vehicle = mongoose.model('Vehicle');
  const Customer = mongoose.model('Customer');

  const vehicle = await Vehicle.findById(vehicleId);
  const customer = await Customer.findById(customerId);

  if (!vehicle || !customer) {
    res.status(400);
    throw new Error('Vehicle or Customer not found');
  }
  
  const latestInfraction = await Infraction.findOne().sort({ createdAt: -1 });
  let newInfractionNumber = 'INF-00001';

  if (latestInfraction && latestInfraction.infractionNumber) {
    const lastNumber = parseInt(latestInfraction.infractionNumber.split('-')[1]);
    newInfractionNumber = `INF-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  const infraction = new Infraction({
    vehicle: vehicle._id,
    customer: customer._id,
    infractionDate: parsedDateInfraction,
    infractionNumber: newInfractionNumber,
    timeInfraction,
    location,
    date: parsedFaitLe,
    permis,
    cin,
    passeport,
    type,
    societe,
    telephone,
    telephone2,
    documents: newDocuments,
    description,
    amount,
    status,
  });

  const createdInfraction = await infraction.save();
  await createdInfraction.populate('vehicle');
  await createdInfraction.populate('customer');
  res.status(201).json(createdInfraction);
});

// @desc    Update an infraction
// @route   PUT /api/infractions/:id
// @access  Private
const updateInfraction = asyncHandler(async (req, res) => {
  console.log('Received request body for update:', req.body);
  console.log('Received files for update:', req.files);

  const { 
    vehicle: vehicleId, customer: customerId, infractionDate, timeInfraction, 
    location, date, permis, cin, passeport, type, societe, 
    telephone, telephone2, description, amount, status, existingDocuments, infractionNumber // Remove infractionNumber from here
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(customerId)) {
    res.status(400);
    throw new Error('Invalid Vehicle or Customer ID');
  }

  const infraction = await Infraction.findById(req.params.id);

  if (infraction) {
    const Vehicle = mongoose.model('Vehicle');
    const Customer = mongoose.model('Customer');

    const vehicle = await Vehicle.findById(vehicleId);
    const customer = await Customer.findById(customerId);

    if (!vehicle || !customer) {
      res.status(400);
      throw new Error('Vehicle or Customer not found');
    }

    infraction.vehicle = vehicle._id;
    infraction.customer = customer._id;
    infraction.infractionDate = new Date(infractionDate);
    infraction.timeInfraction = timeInfraction;
    infraction.location = location;
    infraction.date = new Date(date);
    infraction.permis = permis;
    infraction.cin = cin;
    infraction.passeport = passeport;
    infraction.type = type;
    infraction.societe = societe;
    infraction.telephone = telephone;
    infraction.telephone2 = telephone2;
    infraction.description = description;
    infraction.amount = amount;
    infraction.status = status;

    // Handle new document uploads
    const newDocuments = req.files ? req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size,
    })) : [];

    // Filter out documents that were removed from the frontend
    const currentExistingDocuments = Array.isArray(existingDocuments) ? existingDocuments : (existingDocuments ? [existingDocuments] : []);
    infraction.documents = infraction.documents.filter(doc => currentExistingDocuments.includes(doc.url));
    infraction.documents.push(...newDocuments);

    const updatedInfraction = await infraction.save();
    await updatedInfraction.populate('vehicle');
    await updatedInfraction.populate('customer');
    res.json(updatedInfraction);
  } else {
    res.status(404);
    throw new Error('Infraction not found');
  }
});

// @desc    Delete an infraction
// @route   DELETE /api/infractions/:id
// @access  Private
const deleteInfraction = asyncHandler(async (req, res) => {
  const infraction = await Infraction.findById(req.params.id);

  if (infraction) {
    // Delete associated files from the uploads directory
    infraction.documents.forEach(doc => {
      const filePath = path.join(__dirname, '..', doc.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    await infraction.deleteOne();
    res.json({ message: 'Infraction removed' });
  } else {
    res.status(404);
    throw new Error('Infraction not found');
  }
});

// @desc    Delete a specific document from an infraction
// @route   DELETE /api/infractions/:id/documents
// @access  Private
const deleteInfractionDocument = asyncHandler(async (req, res) => {
  const { documentName } = req.body;
  const infraction = await Infraction.findById(req.params.id);

  if (infraction) {
    const documentToDelete = infraction.documents.find(doc => doc.name === documentName);

    if (documentToDelete) {
      const filePath = path.join(__dirname, '..', documentToDelete.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      infraction.documents = infraction.documents.filter(doc => doc.name !== documentName);
      await infraction.save();
      res.json({ message: 'Document removed successfully', infraction });
    } else {
      res.status(404);
      throw new Error('Document not found');
    }
  } else {
    res.status(404);
    throw new Error('Infraction not found');
  }
});

module.exports = {
  getInfractions,
  getInfractionById,
  createInfraction,
  updateInfraction,
  deleteInfraction,
  deleteInfractionDocument,
};
