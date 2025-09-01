const asyncHandler = require('express-async-handler');
const Traite = require('../models/Traite');
const fs = require('fs');
const path = require('path');

// @desc    Get all traites
// @route   GET /api/traites
// @access  Private
const getTraites = asyncHandler(async (req, res) => {
  const traites = await Traite.find({}).populate('vehicle');
  res.status(200).json(traites);
});

// @desc    Get single traite
// @route   GET /api/traites/:id
// @access  Private
const getTraiteById = asyncHandler(async (req, res) => {
  const traite = await Traite.findById(req.params.id).populate('vehicle');

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
    url: file.path,
    type: file.mimetype,
    size: file.size,
  })) : [];

  const traite = new Traite({
    vehicle,
    mois,
    annee,
    montant,
    datePaiement,
    reference,
    notes,
    documents,
  });

  const createdTraite = await traite.save();
  res.status(201).json(createdTraite);
});

// @desc    Update a traite
// @route   PUT /api/traites/:id
// @access  Private
const updateTraite = asyncHandler(async (req, res) => {
  const { vehicle, mois, annee, montant, datePaiement, reference, notes, existingDocuments } = req.body;

  const traite = await Traite.findById(req.params.id);

  if (traite) {
    traite.vehicle = vehicle || traite.vehicle;
    traite.mois = mois || traite.mois;
    traite.annee = annee || traite.annee;
    traite.montant = montant || traite.montant;
    traite.datePaiement = datePaiement || traite.datePaiement;
    traite.reference = reference || traite.reference;
    traite.notes = notes || traite.notes;

    const updatedDocuments = existingDocuments ? JSON.parse(existingDocuments) : [];

    if (req.files) {
      req.files.forEach(file => {
        updatedDocuments.push({
          name: file.originalname,
          url: file.path,
          type: file.mimetype,
          size: file.size,
        });
      });
    }

    traite.documents = updatedDocuments;

    const updatedTraite = await traite.save();
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
  const traite = await Traite.findById(req.params.id);

  if (traite) {
    await traite.deleteOne();
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
    const traite = await Traite.findById(req.params.id);
  
    if (traite) {
      const documentIndex = traite.documents.findIndex(doc => doc.name === documentName);
  
      if (documentIndex > -1) {
        const document = traite.documents[documentIndex];
        const filePath = path.join(__dirname, '..', document.url);
  
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(err);
            // Decide if you want to stop or continue if file deletion fails
          }
        });
  
        traite.documents.splice(documentIndex, 1);
        await traite.save();
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
