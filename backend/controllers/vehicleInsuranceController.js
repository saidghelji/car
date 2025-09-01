const asyncHandler = require('express-async-handler');
const VehicleInsurance = require('../models/VehicleInsurance');
const fs = require('fs');
const path = require('path');

// @desc    Get all vehicle insurances
// @route   GET /api/vehicleinsurances
// @access  Private
const getVehicleInsurances = asyncHandler(async (req, res) => {
  const vehicleInsurances = await VehicleInsurance.find({}).populate('vehicle').populate('customer');
  res.status(200).json(vehicleInsurances);
});

// @desc    Get single vehicle insurance
// @route   GET /api/vehicleinsurances/:id
// @access  Private
const getVehicleInsuranceById = asyncHandler(async (req, res) => {
  const vehicleInsurance = await VehicleInsurance.findById(req.params.id).populate('vehicle').populate('customer');

  if (vehicleInsurance) {
    res.json(vehicleInsurance);
  } else {
    res.status(404);
    throw new Error('Vehicle insurance not found');
  }
});

// @desc    Create a vehicle insurance
// @route   POST /api/vehicleinsurances
// @access  Private
const createVehicleInsurance = asyncHandler(async (req, res) => {
  const { vehicle, customer, company, policyNumber, operationDate, startDate, duration, endDate, price, contactInfo, observation } = req.body;

  const attachments = req.files && req.files.length > 0 ? req.files.map(file => file.path) : [];

  const vehicleInsurance = new VehicleInsurance({
    vehicle,
    customer,
    company,
    policyNumber,
    operationDate,
    startDate,
    duration,
    endDate,
    price,
    contactInfo,
    observation,
    attachments,
  });

  const createdVehicleInsurance = await vehicleInsurance.save();
  res.status(201).json(createdVehicleInsurance);
});

// @desc    Update a vehicle insurance
// @route   PUT /api/vehicleinsurances/:id
// @access  Private
const updateVehicleInsurance = asyncHandler(async (req, res) => {
  const { vehicle, customer, company, policyNumber, operationDate, startDate, duration, endDate, price, contactInfo, observation } = req.body;

  const vehicleInsurance = await VehicleInsurance.findById(req.params.id);

  if (vehicleInsurance) {
    // Update non-file fields
    if (vehicle) vehicleInsurance.vehicle = vehicle;
    if (customer) vehicleInsurance.customer = customer;
    if (company) vehicleInsurance.company = company;
    if (policyNumber) vehicleInsurance.policyNumber = policyNumber;
    if (operationDate) vehicleInsurance.operationDate = operationDate;
    if (startDate) vehicleInsurance.startDate = startDate;
    if (duration) vehicleInsurance.duration = duration;
    if (endDate) vehicleInsurance.endDate = endDate;
    if (price) vehicleInsurance.price = price;
    if (contactInfo) vehicleInsurance.contactInfo = contactInfo;
    if (observation) vehicleInsurance.observation = observation;

    // Handle attachments update (add new ones)
    if (req.files && req.files.length > 0) {
      const newAttachmentPaths = req.files.map(file => file.path);
      vehicleInsurance.attachments = [...vehicleInsurance.attachments, ...newAttachmentPaths];
    }

    const updatedVehicleInsurance = await vehicleInsurance.save();
    res.json(updatedVehicleInsurance);
  } else {
    res.status(404);
    throw new Error('Vehicle insurance not found');
  }
});

// @desc    Delete a vehicle insurance
// @route   DELETE /api/vehicleinsurances/:id
// @access  Private
const deleteVehicleInsurance = asyncHandler(async (req, res) => {
  const vehicleInsurance = await VehicleInsurance.findById(req.params.id);

  if (vehicleInsurance) {
    await vehicleInsurance.deleteOne();
    res.json({ message: 'Vehicle insurance removed' });
  } else {
    res.status(404);
    throw new Error('Vehicle insurance not found');
  }
});

// @desc    Delete a specific document from a vehicle insurance
// @route   DELETE /api/vehicleinsurances/:id/documents
// @access  Private
const deleteInsuranceDocument = asyncHandler(async (req, res) => {
  const { documentName } = req.body; // Expect documentName from frontend
  const vehicleInsurance = await VehicleInsurance.findById(req.params.id);

  if (vehicleInsurance) {
    let documentRemoved = false;
    let filePathToDelete = '';

    // Check if it's an attachment
    const attachmentIndex = vehicleInsurance.attachments.findIndex(att => att.includes(documentName));
    if (attachmentIndex > -1) {
      filePathToDelete = vehicleInsurance.attachments[attachmentIndex];
      vehicleInsurance.attachments.splice(attachmentIndex, 1);
      documentRemoved = true;
    }

    if (documentRemoved) {
      await vehicleInsurance.save();

      // Delete the physical file
      if (filePathToDelete) {
        const fullPath = path.join(__dirname, '..', filePathToDelete);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting file ${fullPath}:`, err);
            // Log the error but don't prevent success response if DB update was successful
          }
        });
      }

      res.json({ message: 'Document removed successfully', vehicleInsurance });
    } else {
      res.status(404);
      throw new Error('Document not found in this insurance record');
    }
  } else {
    res.status(404);
    throw new Error('Vehicle insurance not found');
  }
});

module.exports = {
  getVehicleInsurances,
  getVehicleInsuranceById,
  createVehicleInsurance,
  updateVehicleInsurance,
  deleteVehicleInsurance,
  deleteInsuranceDocument,
};
