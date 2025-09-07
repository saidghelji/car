const asyncHandler = require('express-async-handler');
const Infraction = require('../models/Infraction.model');
const { Vehicle, Customer } = require('../models');
const path = require('path');
const fs = require('fs');

// @desc    Get all infractions
// @route   GET /api/infractions
// @access  Private
const getInfractions = asyncHandler(async (req, res) => {
  const infractions = await Infraction.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Customer, as: 'client' },
    ],
  });
  res.status(200).json(infractions);
});

// @desc    Get single infraction
// @route   GET /api/infractions/:id
// @access  Private
const getInfractionById = asyncHandler(async (req, res) => {
  const infraction = await Infraction.findByPk(req.params.id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Customer, as: 'client' },
    ],
  });
  if (infraction) res.json(infraction); else { res.status(404); throw new Error('Infraction not found'); }
});

// helper to populate relations
const populateInfraction = async (infraction) => {
  return await Infraction.findByPk(infraction.id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Customer, as: 'client' },
    ],
  });
};

// @desc    Create an infraction
// @route   POST /api/infractions
// @access  Private
const createInfraction = asyncHandler(async (req, res) => {
  const {
    vehicleId, customerId, infractionDate, timeInfraction,
    location, date: faitLe, permis, cin, passeport, type, societe,
    telephone, telephone2, description, amount, status,
  } = req.body;

  const parsedDateInfraction = infractionDate ? new Date(infractionDate) : null;
  const parsedFaitLe = faitLe ? new Date(faitLe) : null;

  const newDocuments = req.files ? req.files.map(file => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`,
    type: file.mimetype,
    size: file.size,
  })) : [];

  // generate infraction number
  const latest = await Infraction.findOne({ order: [['createdAt', 'DESC']] });
  let newInfractionNumber = 'INF-00001';
  if (latest && latest.infractionNumber) {
    const lastNumber = parseInt(latest.infractionNumber.split('-')[1]);
    newInfractionNumber = `INF-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  const infraction = await Infraction.create({
    vehicleId,
    customerId,
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

  const populated = await populateInfraction(infraction);
  res.status(201).json(populated);
});

// @desc    Update an infraction
// @route   PUT /api/infractions/:id
// @access  Private
const updateInfraction = asyncHandler(async (req, res) => {
  const {
    vehicleId, customerId, infractionDate, timeInfraction,
    location, date: faitLe, permis, cin, passeport, type, societe,
    telephone, telephone2, description, amount, status, existingDocuments,
  } = req.body;

  const infraction = await Infraction.findByPk(req.params.id);
  if (!infraction) {
    res.status(404);
    throw new Error('Infraction not found');
  }

  const updatedData = {};
  if (vehicleId !== undefined) updatedData.vehicleId = vehicleId;
  if (customerId !== undefined) updatedData.customerId = customerId;
  if (infractionDate !== undefined) updatedData.infractionDate = new Date(infractionDate);
  if (timeInfraction !== undefined) updatedData.timeInfraction = timeInfraction;
  if (location !== undefined) updatedData.location = location;
  if (faitLe !== undefined) updatedData.date = new Date(faitLe);
  if (permis !== undefined) updatedData.permis = permis;
  if (cin !== undefined) updatedData.cin = cin;
  if (passeport !== undefined) updatedData.passeport = passeport;
  if (type !== undefined) updatedData.type = type;
  if (societe !== undefined) updatedData.societe = societe;
  if (telephone !== undefined) updatedData.telephone = telephone;
  if (telephone2 !== undefined) updatedData.telephone2 = telephone2;
  if (description !== undefined) updatedData.description = description;
  if (amount !== undefined) updatedData.amount = amount;
  if (status !== undefined) updatedData.status = status;

  const currentExistingDocuments = Array.isArray(existingDocuments) ? existingDocuments : (existingDocuments ? [existingDocuments] : []);
  const newDocuments = req.files ? req.files.map(file => ({ name: file.originalname, url: `/uploads/${file.filename}`, type: file.mimetype, size: file.size })) : [];

  // merge documents: keep only those still present in existingDocuments
  const kept = infraction.documents ? infraction.documents.filter(doc => currentExistingDocuments.includes(doc.url)) : [];
  updatedData.documents = [...kept, ...newDocuments];

  await infraction.update(updatedData);
  const refreshed = await Infraction.findByPk(infraction.id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Customer, as: 'client' },
    ],
  });
  res.json(refreshed);
});

// @desc    Delete an infraction
// @route   DELETE /api/infractions/:id
// @access  Private
const deleteInfraction = asyncHandler(async (req, res) => {
  const infraction = await Infraction.findByPk(req.params.id);
  if (infraction) {
    infraction.documents.forEach(doc => {
      const filePath = path.join(__dirname, '..', doc.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    await infraction.destroy();
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
  const infraction = await Infraction.findByPk(req.params.id);
  if (infraction) {
    const documentToDelete = infraction.documents.find(doc => doc.name === documentName);
    if (documentToDelete) {
      const filePath = path.join(__dirname, '..', documentToDelete.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const remaining = infraction.documents.filter(doc => doc.name !== documentName);
      await infraction.update({ documents: remaining });
      res.json({ message: 'Document removed successfully', infraction: await populateInfraction(infraction) });
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
