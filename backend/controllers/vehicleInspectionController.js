const asyncHandler = require('express-async-handler');
const VehicleInspection = require('../models/VehicleInspection');
const fs = require('fs');
const path = require('path');

// @desc    Get all vehicle inspections
// @route   GET /api/vehicleinspections
// @access  Private
const getVehicleInspections = asyncHandler(async (req, res) => {
  const vehicleInspections = await VehicleInspection.find({}).populate('vehicle');
  res.status(200).json(vehicleInspections);
});

// @desc    Get single vehicle inspection
// @route   GET /api/vehicleinspections/:id
// @access  Private
const getVehicleInspectionById = asyncHandler(async (req, res) => {
  const vehicleInspection = await VehicleInspection.findById(req.params.id).populate('vehicle');

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

  const vehicleInspection = new VehicleInspection({
    vehicle,
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

  const createdVehicleInspection = await vehicleInspection.save();
  const populatedInspection = await VehicleInspection.findById(createdVehicleInspection._id).populate('vehicle');
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

  const vehicleInspection = await VehicleInspection.findById(req.params.id);

  if (vehicleInspection) {
    if (vehicle !== undefined) {
      vehicleInspection.vehicle = vehicle;
    }

    if (center !== undefined) vehicleInspection.center = center;
    if (controlId !== undefined) vehicleInspection.controlId = controlId;
    if (authorizationNumber !== undefined) vehicleInspection.authorizationNumber = authorizationNumber;
    if (inspectionDate !== undefined) vehicleInspection.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
    if (duration !== undefined) vehicleInspection.duration = duration;
    if (endDate !== undefined) vehicleInspection.endDate = endDate ? new Date(endDate) : null;
    if (price !== undefined) vehicleInspection.price = price;
    if (centerContact !== undefined) vehicleInspection.centerContact = centerContact;
    if (observation !== undefined) vehicleInspection.observation = observation;
    if (inspectorName !== undefined) vehicleInspection.inspectorName = inspectorName;
    if (results !== undefined) vehicleInspection.results = results;
    if (nextInspectionDate !== undefined) vehicleInspection.nextInspectionDate = nextInspectionDate ? new Date(nextInspectionDate) : null;
    
    // Handle documents: combine existing (from req.body) with new uploads (from req.files)
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

    // Combine existing documents (from frontend) with newly uploaded documents
    vehicleInspection.documents = [...existingDocuments, ...newDocuments];


    const updatedVehicleInspection = await vehicleInspection.save();
    const populatedInspection = await VehicleInspection.findById(updatedVehicleInspection._id).populate('vehicle');
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
  const vehicleInspection = await VehicleInspection.findById(req.params.id);

  if (vehicleInspection) {
    await vehicleInspection.deleteOne();
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
  const vehicleInspection = await VehicleInspection.findById(req.params.id);

  if (vehicleInspection) {
    let filePathToDelete = '';
    const documentIndex = vehicleInspection.documents.findIndex(doc => doc.url === documentUrl);

    if (documentIndex > -1) {
      filePathToDelete = vehicleInspection.documents[documentIndex].url;
      vehicleInspection.documents.splice(documentIndex, 1);
    } else {
      res.status(404);
      throw new Error('Document not found in this inspection record');
    }

    await vehicleInspection.save();

    // Delete the physical file
    if (filePathToDelete) {
      // The URL stored in the DB is relative to the project root (e.g., 'uploads/filename.pdf')
      // We need to construct the absolute path from the current controller file.
      const fullPath = path.join(__dirname, '..', '..', filePathToDelete);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Error deleting file ${fullPath}:`, err);
          // Log the error but don't prevent success response if DB update was successful
        }
      });
    }

    res.json({ message: 'Document removed successfully', vehicleInspection });
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
