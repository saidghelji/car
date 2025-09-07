const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle.model');
const VehicleInspection = require('../models/VehicleInspection.model');
const VehicleInsurance = require('../models/VehicleInsurance.model');
const Infraction = require('../models/Infraction.model');
const Intervention = require('../models/Intervention.model');
const Contract = require('../models/Contract.model');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.findAll({ order: [['createdAt', 'DESC']] });
  res.status(200).json(vehicles);
});

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id, {
    include: [
      { model: VehicleInspection, as: 'inspections' },
      { model: VehicleInsurance, as: 'insurances' },
      { model: Contract, as: 'contracts' },
    ],
  });
  if (vehicle) {
    res.json(vehicle);
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Private
const createVehicle = asyncHandler(async (req, res) => {
  const payload = req.body;
  const createdVehicle = await Vehicle.create(payload);
  res.status(201).json(createdVehicle);
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  await vehicle.update(req.body);
  const refreshed = await Vehicle.findByPk(vehicle.id, {
    include: [
      { model: VehicleInspection, as: 'inspections' },
      { model: VehicleInsurance, as: 'insurances' },
      { model: Contract, as: 'contracts' },
    ],
  });
  res.json(refreshed);
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);

  if (vehicle) {
    // Set the vehicle foreign keys to null in related tables
    await VehicleInspection.update({ vehicleId: null }, { where: { vehicleId: req.params.id } });
    await VehicleInsurance.update({ vehicleId: null }, { where: { vehicleId: req.params.id } });
    await Infraction.update({ vehicleId: null }, { where: { vehicleId: req.params.id } });
    await Intervention.update({ vehicleId: null }, { where: { vehicleId: req.params.id } });

    await vehicle.destroy();
    res.json({ message: 'Vehicle removed' });
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
