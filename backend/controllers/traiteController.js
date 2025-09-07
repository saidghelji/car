const asyncHandler = require('express-async-handler');
const Traite = require('../models/Traite.model');
const Vehicle = require('../models/Vehicle.model');
const fs = require('fs');
const path = require('path');

// @desc    Get all traites
// @route   GET /api/traites
// @access  Private
const getTraites = asyncHandler(async (req, res) => {
  const traites = await Traite.findAll({ include: [{ model: Vehicle, as: 'vehicle' }] });
  res.status(200).json(traites);
});

// @desc    Get single traite
// @route   GET /api/traites/:id
// @access  Private
const getTraiteById = asyncHandler(async (req, res) => {
  const traite = await Traite.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }] });

  if (traite) {
    res.json(traite);
  } else {
    res.status(404);
    throw new Error('Traite not found');
  }
});

// @desc    Create a traite
// @route   POST /api/traites
// @access  Private
const createTraite = asyncHandler(async (req, res) => {
  const { vehicle, mois, annee, montant, datePaiement, reference, notes } = req.body;

  const documents = req.files ? req.files.map(file => ({
    name: file.originalname,
    url: file.path.replace(/\\/g, '/'),
    type: file.mimetype,
    size: file.size,
  })) : [];

  const createdTraite = await Traite.create({
    vehicleId: vehicle,
    mois,
    annee,
    montant,
    datePaiement,
    reference,
    notes,
    documents,
  });

  const populated = await Traite.findByPk(createdTraite.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
  res.status(201).json(populated);
});

// @desc    Update a traite
// @route   PUT /api/traites/:id
// @access  Private
const updateTraite = asyncHandler(async (req, res) => {
  const { vehicle, mois, annee, montant, datePaiement, reference, notes, existingDocuments } = req.body;

  const traite = await Traite.findByPk(req.params.id);

  if (traite) {
    const updatedData = {};
    if (vehicle !== undefined) updatedData.vehicleId = vehicle;
    if (mois !== undefined) updatedData.mois = mois;
    if (annee !== undefined) updatedData.annee = annee;
    if (montant !== undefined) updatedData.montant = montant;
    if (datePaiement !== undefined) updatedData.datePaiement = datePaiement;
    if (reference !== undefined) updatedData.reference = reference;
    if (notes !== undefined) updatedData.notes = notes;

    let updatedDocuments = [];
  if (existingDocuments) {
      try {
        updatedDocuments = Array.isArray(existingDocuments) ? existingDocuments : JSON.parse(existingDocuments);
      } catch (e) {
        updatedDocuments = [];
      }
    }

    const newDocs = req.files ? req.files.map(file => ({ name: file.originalname, url: file.path.replace(/\\/g, '/'), type: file.mimetype, size: file.size })) : [];
    updatedData.documents = [...updatedDocuments, ...newDocs];

    await traite.update(updatedData);
    const updatedTraite = await Traite.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
    res.json(updatedTraite);
  } else {
    res.status(404);
    throw new Error('Traite not found');
  }
});

// @desc    Delete a traite
// @route   DELETE /api/traites/:id
// @access  Private
const deleteTraite = asyncHandler(async (req, res) => {
  const traite = await Traite.findByPk(req.params.id);

  if (traite) {
    await traite.destroy();
    res.json({ message: 'Traite removed' });
  } else {
    res.status(404);
    throw new Error('Traite not found');
  }
});

// @desc    Delete a traite document
// @route   DELETE /api/traites/:id/documents
// @access  Private
const deleteTraiteDocument = asyncHandler(async (req, res) => {
  const { documentName } = req.body;
  const traite = await Traite.findByPk(req.params.id);

  if (traite) {
    const documentIndex = traite.documents.findIndex(doc => doc.name === documentName);

    if (documentIndex > -1) {
      const document = traite.documents[documentIndex];
      const filePath = path.join(__dirname, '..', document.url);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
        }
      });

      const newDocs = [...traite.documents];
      newDocs.splice(documentIndex, 1);
      await traite.update({ documents: newDocs });
      res.json({ message: 'Document removed' });
    } else {
      res.status(404);
      throw new Error('Document not found');
    }
  } else {
    res.status(404);
    throw new Error('Traite not found');
  }
});

module.exports = {
  getTraites,
  getTraiteById,
  createTraite,
  updateTraite,
  deleteTraite,
  deleteTraiteDocument,
};
