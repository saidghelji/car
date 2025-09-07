const asyncHandler = require('express-async-handler');
const VehicleInspection = require('../models/VehicleInspection.model');
const Vehicle = require('../models/Vehicle.model');
const fs = require('fs');
const path = require('path');

// @desc    Get all vehicle inspections
// @route   GET /api/vehicleinspections
// @access  Private
const getVehicleInspections = asyncHandler(async (req, res) => {
  const vehicleInspections = await VehicleInspection.findAll({ include: [{ model: Vehicle, as: 'vehicle' }] });
  res.status(200).json(vehicleInspections);
});

// @desc    Get single vehicle inspection
// @route   GET /api/vehicleinspections/:id
// @access  Private
const getVehicleInspectionById = asyncHandler(async (req, res) => {
  const vehicleInspection = await VehicleInspection.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }] });

  if (vehicleInspection) {
    res.json(vehicleInspection);
  } else {
    res.status(404);
    throw new Error('Vehicle inspection not found');
  }
});

// @desc    Create a vehicle inspection
// @route   POST /api/vehicleinspections
// @access  Private
const createVehicleInspection = asyncHandler(async (req, res) => {
  const {
    vehicle, center, controlId, authorizationNumber, inspectionDate,
    duration, endDate, price, centerContact, observation,
    inspectorName, results, nextInspectionDate
  } = req.body;

  const newDocuments = req.files ? req.files.map(file => ({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    url: file.path.replace(/\\/g, '/'),
  })) : [];

  const created = await VehicleInspection.create({
    vehicleId: vehicle,
    center: center === undefined || center === null ? '' : center,
    controlId: controlId === undefined || controlId === null ? '' : controlId,
    authorizationNumber: authorizationNumber === undefined || authorizationNumber === null ? '' : authorizationNumber,
    inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
    duration: duration === undefined || duration === null ? null : duration,
    endDate: endDate ? new Date(endDate) : null,
    price: price === undefined || price === null ? null : price,
    centerContact: centerContact === undefined || centerContact === null ? '' : centerContact,
    observation: observation === undefined || observation === null ? '' : observation,
    inspectorName: inspectorName === undefined || inspectorName === null ? '' : inspectorName,
    results: results === undefined || results === null ? '' : results,
    nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
    documents: newDocuments,
  });

  const populatedInspection = await VehicleInspection.findByPk(created.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
  res.status(201).json(populatedInspection);
});

// @desc    Update a vehicle inspection
// @route   PUT /api/vehicleinspections/:id
// @access  Private
const updateVehicleInspection = asyncHandler(async (req, res) => {
  const {
    vehicle, center, controlId, authorizationNumber, inspectionDate,
    duration, endDate, price, centerContact, observation,
    inspectorName, results, nextInspectionDate, existingDocuments: existingDocumentsString
  } = req.body;

  const vehicleInspection = await VehicleInspection.findByPk(req.params.id);

  if (vehicleInspection) {
    const updates = {};
    if (vehicle !== undefined) updates.vehicleId = vehicle;
    if (center !== undefined) updates.center = center;
    if (controlId !== undefined) updates.controlId = controlId;
    if (authorizationNumber !== undefined) updates.authorizationNumber = authorizationNumber;
    if (inspectionDate !== undefined) updates.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
    if (duration !== undefined) updates.duration = duration;
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (price !== undefined) updates.price = price;
    if (centerContact !== undefined) updates.centerContact = centerContact;
    if (observation !== undefined) updates.observation = observation;
    if (inspectorName !== undefined) updates.inspectorName = inspectorName;
    if (results !== undefined) updates.results = results;
    if (nextInspectionDate !== undefined) updates.nextInspectionDate = nextInspectionDate ? new Date(nextInspectionDate) : null;

    let existingDocuments = [];
    if (existingDocumentsString) {
      try {
        existingDocuments = JSON.parse(existingDocumentsString);
      } catch (e) {
        existingDocuments = [];
      }
    }

    const newDocuments = req.files ? req.files.map(file => ({ name: file.originalname, type: file.mimetype, size: file.size, url: file.path.replace(/\\/g, '/') })) : [];
    updates.documents = [...existingDocuments, ...newDocuments];

    await vehicleInspection.update(updates);
    const populatedInspection = await VehicleInspection.findByPk(vehicleInspection.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
    res.json(populatedInspection);
  } else {
    res.status(404);
    throw new Error('Vehicle inspection not found');
  }
});

// @desc    Delete a vehicle inspection
// @route   DELETE /api/vehicleinspections/:id
// @access  Private
const deleteVehicleInspection = asyncHandler(async (req, res) => {
  const vehicleInspection = await VehicleInspection.findByPk(req.params.id);

  if (vehicleInspection) {
    await vehicleInspection.destroy();
    res.json({ message: 'Vehicle inspection removed' });
  } else {
    res.status(404);
    throw new Error('Vehicle inspection not found');
  }
});

// @desc    Remove a document from a vehicle inspection
// @route   DELETE /api/vehicleinspections/:id/documents
// @access  Private
const removeInspectionDocument = asyncHandler(async (req, res) => {
  const { documentUrl } = req.body; // Expect documentUrl from frontend
  const vehicleInspection = await VehicleInspection.findByPk(req.params.id);

  if (vehicleInspection) {
    const documentIndex = vehicleInspection.documents.findIndex(doc => doc.url === documentUrl);
    if (documentIndex > -1) {
      const filePathToDelete = vehicleInspection.documents[documentIndex].url;
      const newDocs = [...vehicleInspection.documents];
      newDocs.splice(documentIndex, 1);
      await vehicleInspection.update({ documents: newDocs });

      // Delete the physical file
      if (filePathToDelete) {
        const fullPath = path.join(__dirname, '..', '..', filePathToDelete);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting file ${fullPath}:`, err);
          }
        });
      }

      const refreshed = await VehicleInspection.findByPk(vehicleInspection.id, { include: [{ model: Vehicle, as: 'vehicle' }] });
      res.json({ message: 'Document removed successfully', vehicleInspection: refreshed });
    } else {
      res.status(404);
      throw new Error('Document not found in this inspection record');
    }
  } else {
    res.status(404);
    throw new Error('Vehicle inspection not found');
  }
});

module.exports = {
  getVehicleInspections,
  getVehicleInspectionById,
  createVehicleInspection,
  updateVehicleInspection,
  deleteVehicleInspection,
  removeInspectionDocument,
};
