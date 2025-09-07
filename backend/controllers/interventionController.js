const asyncHandler = require('express-async-handler');
const Intervention = require('../models/Intervention.model');
const Vehicle = require('../models/Vehicle.model');

// @desc    Get all interventions
// @route   GET /api/interventions
// @access  Private
const getInterventions = asyncHandler(async (req, res) => {
  const interventions = await Intervention.findAll({ order: [['createdAt', 'DESC']], include: [{ model: Vehicle, as: 'vehicle' }] });
  res.status(200).json(interventions);
});

// @desc    Get single intervention
// @route   GET /api/interventions/:id
// @access  Private
const getInterventionById = asyncHandler(async (req, res) => {
  const intervention = await Intervention.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
  if (intervention) {
    res.json(intervention);
  } else {
    res.status(404);
    throw new Error('Intervention not found');
  }
});

// @desc    Create an intervention
// @route   POST /api/interventions
// @access  Private
const createIntervention = asyncHandler(async (req, res) => {
  const { vehicle, description, date, cost, status, type, observation, currentMileage, nextMileage } = req.body;

  // Validate required fields
  if (!vehicle || !description || !date || !cost || !status || !type) {
    res.status(400);
    throw new Error('Please add all required fields: vehicle, description, date, cost, status, type');
  }

  // Validate date format
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    res.status(400);
    throw new Error('Invalid date format. Please provide a valid date.');
  }

  const documents = req.files && Array.isArray(req.files) ? req.files.map(file => ({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    url: file.path.replace(/\\/g, '/'),
  })) : [];

  const createdIntervention = await Intervention.create({
    vehicleId: vehicle,
    description,
    date: parsedDate,
    cost,
    status,
    type,
    observation,
    currentMileage,
    nextMileage,
    documents,
  });

  const populated = await Intervention.findByPk(createdIntervention.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
  res.status(201).json(populated);
});

// @desc    Update an intervention
// @route   PUT /api/interventions/:id
// @access  Private
const updateIntervention = asyncHandler(async (req, res) => {
  // Remove any stringified 'documents' from body to avoid parsing issues
  if (req.body.documents) delete req.body.documents;

  const intervention = await Intervention.findByPk(req.params.id);
  if (!intervention) {
    res.status(404);
    throw new Error('Intervention not found');
  }

  // Build updates object
  const updates = {};
  if (req.body.vehicle !== undefined) updates.vehicleId = req.body.vehicle;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.date !== undefined) {
    const parsedDate = new Date(req.body.date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error('Invalid date format for update. Please provide a valid date.');
    }
    updates.date = parsedDate;
  }
  if (req.body.cost !== undefined) updates.cost = req.body.cost;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.observation !== undefined) updates.observation = req.body.observation;
  if (req.body.currentMileage !== undefined) updates.currentMileage = req.body.currentMileage;
  if (req.body.nextMileage !== undefined) updates.nextMileage = req.body.nextMileage;

  // Handle documents: merge existing retained docs and new uploaded files
  let finalDocuments = [];
  let existingDocumentsFromFrontend = req.body.existingDocuments;
  if (existingDocumentsFromFrontend) {
    if (typeof existingDocumentsFromFrontend === 'string') {
      try { existingDocumentsFromFrontend = JSON.parse(existingDocumentsFromFrontend); } catch (e) { existingDocumentsFromFrontend = [existingDocumentsFromFrontend]; }
    }
    const existingDocsArray = Array.isArray(existingDocumentsFromFrontend) ? existingDocumentsFromFrontend : [existingDocumentsFromFrontend];
    const retainedExistingDocs = (intervention.documents || []).filter(doc => {
      const normalizedDocUrl = doc.url.replace(/\\/g, '/');
      return existingDocsArray.some(existingUrl => existingUrl.replace(/\\/g, '/') === normalizedDocUrl);
    });
    finalDocuments = [...retainedExistingDocs];
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const newDocs = req.files.map(file => ({ name: file.originalname, type: file.mimetype, size: file.size, url: file.path.replace(/\\/g, '/') }));
    finalDocuments = [...finalDocuments, ...newDocs];
  }

  if (finalDocuments.length) updates.documents = finalDocuments;

  await intervention.update(updates);
  const populated = await Intervention.findByPk(intervention.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
  res.json(populated);
});

// @desc    Delete an intervention
// @route   DELETE /api/interventions/:id
// @access  Private
const deleteIntervention = asyncHandler(async (req, res) => {
  const intervention = await Intervention.findByPk(req.params.id);
  if (intervention) {
    await intervention.destroy();
    res.json({ message: 'Intervention removed' });
  } else {
    res.status(404);
    throw new Error('Intervention not found');
  }
});

module.exports = {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  deleteIntervention,
};
