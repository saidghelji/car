const asyncHandler = require('express-async-handler');
const VehicleInsurance = require('../models/VehicleInsurance.model');
const Vehicle = require('../models/Vehicle.model');
const Customer = require('../models/Customer.model');
const fs = require('fs');
const path = require('path');

// @desc    Get all vehicle insurances
// @route   GET /api/vehicleinsurances
// @access  Private
const getVehicleInsurances = asyncHandler(async (req, res) => {
  const vehicleInsurances = await VehicleInsurance.findAll({ include: [{ model: Vehicle, as: 'vehicle' }, { model: Customer, as: 'customer' }] });
  res.status(200).json(vehicleInsurances);
});

// @desc    Get single vehicle insurance
// @route   GET /api/vehicleinsurances/:id
// @access  Private
const getVehicleInsuranceById = asyncHandler(async (req, res) => {
  const vehicleInsurance = await VehicleInsurance.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }, { model: Customer, as: 'customer' }] });

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

  const attachments = req.files && req.files.length > 0 ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];

  const created = await VehicleInsurance.create({ vehicleId: vehicle, customerId: customer, company, policyNumber, operationDate, startDate, duration, endDate, price, contactInfo, observation, attachments });
  const populated = await VehicleInsurance.findByPk(created.id, { include: [{ model: Vehicle, as: 'vehicle' }, { model: Customer, as: 'customer' }] });
  res.status(201).json(populated);
});

// @desc    Update a vehicle insurance
// @route   PUT /api/vehicleinsurances/:id
// @access  Private
const updateVehicleInsurance = asyncHandler(async (req, res) => {
  const { vehicle, customer, company, policyNumber, operationDate, startDate, duration, endDate, price, contactInfo, observation } = req.body;

  const vehicleInsurance = await VehicleInsurance.findByPk(req.params.id);

  if (vehicleInsurance) {
    const updates = {};
    if (vehicle !== undefined) updates.vehicleId = vehicle;
    if (customer !== undefined) updates.customerId = customer;
    if (company !== undefined) updates.company = company;
    if (policyNumber !== undefined) updates.policyNumber = policyNumber;
    if (operationDate !== undefined) updates.operationDate = operationDate;
    if (startDate !== undefined) updates.startDate = startDate;
    if (duration !== undefined) updates.duration = duration;
    if (endDate !== undefined) updates.endDate = endDate;
    if (price !== undefined) updates.price = price;
    if (contactInfo !== undefined) updates.contactInfo = contactInfo;
    if (observation !== undefined) updates.observation = observation;

    if (req.files && req.files.length > 0) {
      const newAttachmentPaths = req.files.map(file => file.path.replace(/\\/g, '/'));
      updates.attachments = [...(vehicleInsurance.attachments || []), ...newAttachmentPaths];
    }

    await vehicleInsurance.update(updates);
    const populated = await VehicleInsurance.findByPk(vehicleInsurance.id, { include: [{ model: Vehicle, as: 'vehicle' }, { model: Customer, as: 'customer' }] });
    res.json(populated);
  } else {
    res.status(404);
    throw new Error('Vehicle insurance not found');
  }
});

// @desc    Delete a vehicle insurance
// @route   DELETE /api/vehicleinsurances/:id
// @access  Private
const deleteVehicleInsurance = asyncHandler(async (req, res) => {
  const vehicleInsurance = await VehicleInsurance.findByPk(req.params.id);
  if (vehicleInsurance) {
    await vehicleInsurance.destroy();
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
  const vehicleInsurance = await VehicleInsurance.findByPk(req.params.id);
  if (vehicleInsurance) {
    let documentRemoved = false;
    let filePathToDelete = '';
    const attachmentIndex = (vehicleInsurance.attachments || []).findIndex(att => att.includes(documentName));
    if (attachmentIndex > -1) {
      filePathToDelete = vehicleInsurance.attachments[attachmentIndex];
      const newAttachments = [...vehicleInsurance.attachments];
      newAttachments.splice(attachmentIndex, 1);
      await vehicleInsurance.update({ attachments: newAttachments });
      documentRemoved = true;
    }

    if (documentRemoved) {
      if (filePathToDelete) {
        const fullPath = path.join(__dirname, '..', filePathToDelete);
        fs.unlink(fullPath, (err) => {
          if (err) console.error(`Error deleting file ${fullPath}:`, err);
        });
      }
      const populated = await VehicleInsurance.findByPk(vehicleInsurance.id, { include: [{ model: Vehicle, as: 'vehicle' }, { model: Customer, as: 'customer' }] });
      res.json({ message: 'Document removed successfully', vehicleInsurance: populated });
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
