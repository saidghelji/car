const asyncHandler = require('express-async-handler');
const Accident = require('../models/Accident');
const Contract = require('../models/Contract');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// @desc    Get all accidents
// @route   GET /api/accidents
// @access  Private
const getAccidents = asyncHandler(async (req, res) => {
  const accidents = await Accident.find({})
    .populate({
      path: 'contrat',
      populate: {
        path: 'client vehicle',
      },
    })
    .populate('client')
    .populate('vehicule');
  res.status(200).json(accidents);
});

// @desc    Get single accident
// @route   GET /api/accidents/:id
// @access  Private
const getAccidentById = asyncHandler(async (req, res) => {
  const accident = await Accident.findById(req.params.id)
    .populate({
      path: 'contrat',
      populate: {
        path: 'client vehicle',
      },
    })
    .populate('client')
    .populate('vehicule');

  if (accident) {
    res.json(accident);
  } else {
    res.status(404);
    throw new Error('Accident not found');
  }
});

// @desc    Create an accident
// @route   POST /api/accidents
// @access  Private
const createAccident = asyncHandler(async (req, res) => {
  const {
    contrat: contratId,
    dateAccident,
    heureAccident,
    lieuAccident,
    description,
    etat,
    dateEntreeGarage,
    dateReparation,
    montantReparation,
    fraisClient,
    indemniteAssurance,
    avance,
  } = req.body;

  const contrat = await Contract.findById(contratId).populate('client').populate('vehicle');

  if (!contrat) {
    res.status(404);
    throw new Error('Contrat not found');
  }

  if (!contrat.client) {
    res.status(400);
    throw new Error('Client associated with this contract could not be found.');
  }

  if (!contrat.vehicle) {
    res.status(400);
    throw new Error(`Vehicle associated with contract ${contrat.contractNumber} could not be found. It might have been deleted or the reference is broken.`);
  }

  const documents = req.files ? req.files.map(file => ({
    name: file.originalname,
    url: file.path,
    type: file.mimetype,
    size: file.size,
  })) : [];

  const accident = new Accident({
    contrat: contrat._id,
    numeroContrat: contrat.contractNumber,
    dateSortie: contrat.departureDate,
    client: contrat.client._id,
    clientNom: `${contrat.client.nomFr} ${contrat.client.prenomFr}`,
    dateRetour: contrat.returnDate,
    matricule: contrat.matricule,
    vehicule: contrat.vehicle._id,
    dateAccident,
    heureAccident,
    lieuAccident,
    description,
    etat,
    dateEntreeGarage,
    dateReparation,
    montantReparation,
    fraisClient,
    indemniteAssurance,
    avance,
    documents,
  });

  const createdAccident = await accident.save();
  const populatedAccident = await Accident.findById(createdAccident._id)
    .populate({
      path: 'contrat',
      populate: {
        path: 'client vehicle',
      },
    })
    .populate('client')
    .populate('vehicule');
  res.status(201).json(populatedAccident);
});

// @desc    Update an accident
// @route   PUT /api/accidents/:id
// @access  Private
const updateAccident = asyncHandler(async (req, res) => {
  const accident = await Accident.findById(req.params.id);

  if (accident) {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== null && req.body[key] !== undefined) {
        accident[key] = req.body[key];
      }
    });

    let existingDocuments = [];
    if (req.body.existingDocuments) {
      try {
        existingDocuments = JSON.parse(req.body.existingDocuments);
      } catch (e) {
        console.error('Error parsing existingDocuments:', e);
      }
    }
    
    const newDocuments = req.files ? req.files.map(file => ({
      name: file.originalname,
      url: file.path,
      type: file.mimetype,
      size: file.size,
    })) : [];

    accident.documents = [...existingDocuments, ...newDocuments];

    const updatedAccident = await accident.save();
    const populatedAccident = await Accident.findById(updatedAccident._id)
      .populate({
        path: 'contrat',
        populate: {
          path: 'client vehicle',
        },
      })
      .populate('client')
      .populate('vehicule');
    res.json(populatedAccident);
  } else {
    res.status(404);
    throw new Error('Accident not found');
  }
});

// @desc    Delete an accident
// @route   DELETE /api/accidents/:id
// @access  Private
const deleteAccident = asyncHandler(async (req, res) => {
  const accident = await Accident.findById(req.params.id);

  if (accident) {
    // Optionally, delete associated files from storage
    if (accident.documents && accident.documents.length > 0) {
      accident.documents.forEach(doc => {
        if (fs.existsSync(doc.url)) {
          fs.unlinkSync(doc.url);
        }
      });
    }
    await accident.deleteOne();
    res.json({ message: 'Accident removed' });
  } else {
    res.status(404);
    throw new Error('Accident not found');
  }
});

// @desc    Delete a document from an accident
// @route   DELETE /api/accidents/:id/documents
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { documentUrl } = req.body;
  const accident = await Accident.findById(req.params.id);

  if (accident) {
    // Remove the document from the array
    accident.documents = accident.documents.filter(doc => doc.url !== documentUrl);
    
    // Delete the file from the filesystem
    if (fs.existsSync(documentUrl)) {
      fs.unlinkSync(documentUrl);
    }

    await accident.save();
    res.json({ message: 'Document removed' });
  } else {
    res.status(404);
    throw new Error('Accident not found');
  }
});

module.exports = {
  getAccidents,
  getAccidentById,
  createAccident,
  updateAccident,
  deleteAccident,
  deleteDocument,
  upload, // Export multer instance
};
