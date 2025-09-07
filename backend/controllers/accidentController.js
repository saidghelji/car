const asyncHandler = require('express-async-handler');
const Accident = require('../models/Accident.model');
const { Contract, Customer, Vehicle } = require('../models');
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
  const accidents = await Accident.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' }] },
      { model: Customer, as: 'client' },
      { model: Vehicle, as: 'vehicle' },
    ],
  });
  res.status(200).json(accidents);
});

// @desc    Get single accident
// @route   GET /api/accidents/:id
// @access  Private
const getAccidentById = asyncHandler(async (req, res) => {
  const accident = await Accident.findByPk(req.params.id, {
    include: [
      { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' }] },
      { model: Customer, as: 'client' },
      { model: Vehicle, as: 'vehicle' },
    ],
  });
  if (!accident) {
    res.status(404);
    throw new Error('Accident not found');
  }
  res.json(accident);
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


    const contrat = await Contract.findByPk(contratId, {
      include: [
        { model: Customer, as: 'client' },
        { model: Vehicle, as: 'vehicle' },
      ],
    });
    if (!contrat) {
      res.status(404);
      throw new Error('Contrat not found');
    }
    // use included associations (if present) to avoid extra queries
    const contratClient = contrat.client || null;
    const contratVehicle = contrat.vehicle || null;
    if (!contratClient) {
      res.status(400);
      throw new Error('Client associated with this contract could not be found.');
    }
    if (!contratVehicle) {
      res.status(400);
      throw new Error(`Vehicle associated with contract ${contrat.contractNumber} could not be found.`);
    }

  const documents = req.files ? req.files.map(file => ({
    name: file.originalname,
    url: file.path,
    type: file.mimetype,
    size: file.size,
  })) : [];

    const accident = await Accident.create({
      contractId: contrat.id,
      numeroContrat: contrat.contractNumber,
      dateSortie: contrat.departureDate,
      clientId: contrat.clientId,
      clientNom: `${contratClient.nomFr} ${contratClient.prenomFr}`,
      dateRetour: contrat.returnDate,
      matricule: contrat.matricule,
      vehicleId: contrat.vehicleId,
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

    const populatedAccident = await Accident.findByPk(accident.id, {
      include: [
        { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' }] },
        { model: Customer, as: 'client' },
        { model: Vehicle, as: 'vehicle' },
      ],
    });
    res.status(201).json(populatedAccident);
});

// @desc    Update an accident
// @route   PUT /api/accidents/:id
// @access  Private
const updateAccident = asyncHandler(async (req, res) => {

    const accident = await Accident.findByPk(req.params.id);
    if (!accident) {
      res.status(404);
      throw new Error('Accident not found');
    }

    const updatedData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== null && req.body[key] !== undefined) {
        updatedData[key] = req.body[key];
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

    updatedData.documents = [...existingDocuments, ...newDocuments];

    await accident.update(updatedData);
    const updatedAccident = await Accident.findByPk(accident.id, {
      include: [
        { model: Contract, as: 'contract', include: [{ model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' }] },
        { model: Customer, as: 'client' },
        { model: Vehicle, as: 'vehicle' },
      ],
    });
    res.json(updatedAccident);
});

// @desc    Delete an accident
// @route   DELETE /api/accidents/:id
// @access  Private
const deleteAccident = asyncHandler(async (req, res) => {

    const accident = await Accident.findByPk(req.params.id);
    if (!accident) {
      res.status(404);
      throw new Error('Accident not found');
    }
    if (accident.documents && accident.documents.length > 0) {
      accident.documents.forEach(doc => {
        if (fs.existsSync(doc.url)) {
          fs.unlinkSync(doc.url);
        }
      });
    }
    await accident.destroy();
    res.json({ message: 'Accident removed' });
});

// @desc    Delete a document from an accident
// @route   DELETE /api/accidents/:id/documents
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { documentUrl } = req.body;

    const accident = await Accident.findByPk(req.params.id);
    if (!accident) {
      res.status(404);
      throw new Error('Accident not found');
    }
    accident.documents = accident.documents.filter(doc => doc.url !== documentUrl);
    if (fs.existsSync(documentUrl)) {
      fs.unlinkSync(documentUrl);
    }
    await accident.update({ documents: accident.documents });
    res.json({ message: 'Document removed' });
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
