const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');
const VehicleInspection = require('../models/VehicleInspection');
const VehicleInsurance = require('../models/VehicleInsurance');
const Infraction = require('../models/Infraction');
const Intervention = require('../models/Intervention');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({});
  res.status(200).json(vehicles);
});

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

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
  const {
    chassisNumber,
    imageUrl,
    temporaryPlate,
    licensePlate,
    brand,
    model,
    circulationDate,
    fuelType,
    fuelLevel,
    mileage,
    color,
    colorCode,
    rentalPrice,
    nombreDePlaces,
    nombreDeVitesses,
    transmission,
    observation,
    equipment,
    documents,
    statut,
    autorisationDate,
    autorisationValidity,
    carteGriseDate,
    carteGriseValidity,
  } = req.body;

  const vehicle = new Vehicle({
    chassisNumber,
    imageUrl,
    temporaryPlate,
    licensePlate,
    brand,
    model,
    circulationDate,
    fuelType,
    fuelLevel,
    mileage,
    color,
    colorCode,
    rentalPrice,
    nombreDePlaces,
    nombreDeVitesses,
    transmission,
    observation,
    equipment,
    documents,
    statut,
    autorisationDate,
    autorisationValidity,
    carteGriseDate,
    carteGriseValidity,
  });

  const createdVehicle = await vehicle.save();
  res.status(201).json(createdVehicle);
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = asyncHandler(async (req, res) => {
  const {
    chassisNumber,
    imageUrl,
    temporaryPlate,
    licensePlate,
    brand,
    model,
    circulationDate,
    fuelType,
    fuelLevel,
    mileage,
    color,
    colorCode,
    rentalPrice,
    nombreDePlaces,
    nombreDeVitesses,
    transmission,
    observation,
    equipment,
    documents,
    statut,
    autorisationDate,
    autorisationValidity,
    carteGriseDate,
    carteGriseValidity,
  } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);

  if (vehicle) {
    vehicle.chassisNumber = chassisNumber ?? vehicle.chassisNumber;
    vehicle.imageUrl = imageUrl ?? vehicle.imageUrl;
    vehicle.temporaryPlate = temporaryPlate ?? vehicle.temporaryPlate;
    vehicle.licensePlate = licensePlate ?? vehicle.licensePlate;
    vehicle.brand = brand ?? vehicle.brand;
    vehicle.model = model ?? vehicle.model;
    vehicle.circulationDate = circulationDate ?? vehicle.circulationDate;
    vehicle.fuelType = fuelType ?? vehicle.fuelType;
    vehicle.fuelLevel = fuelLevel ?? vehicle.fuelLevel;
    vehicle.mileage = mileage ?? vehicle.mileage;
    vehicle.color = color ?? vehicle.color;
    vehicle.colorCode = colorCode ?? vehicle.colorCode;
    vehicle.rentalPrice = rentalPrice ?? vehicle.rentalPrice;
    vehicle.nombreDePlaces = nombreDePlaces ?? vehicle.nombreDePlaces;
    vehicle.nombreDeVitesses = nombreDeVitesses ?? vehicle.nombreDeVitesses;
    vehicle.transmission = transmission ?? vehicle.transmission;
    vehicle.autorisationDate = autorisationDate ?? vehicle.autorisationDate;
    vehicle.autorisationValidity = autorisationValidity ?? vehicle.autorisationValidity;
    vehicle.carteGriseDate = carteGriseDate ?? vehicle.carteGriseDate;
    vehicle.carteGriseValidity = carteGriseValidity ?? vehicle.carteGriseValidity;
    // Explicitly check for undefined to allow 0 to be a valid update
    vehicle.observation = observation ?? vehicle.observation;
    vehicle.equipment = equipment ?? vehicle.equipment;
    vehicle.documents = documents ?? vehicle.documents;
    vehicle.statut = statut ?? vehicle.statut;

    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (vehicle) {
    // Set the vehicle field to null in all related VehicleInspection documents
    await VehicleInspection.updateMany(
      { vehicle: req.params.id },
      { $set: { vehicle: null } }
    );

    // Set the vehicle field to null in all related VehicleInsurance documents
    await VehicleInsurance.updateMany(
      { vehicle: req.params.id },
      { $set: { vehicle: null } }
    );

    // Set the vehicle field to null in all related Infraction documents
    await Infraction.updateMany(
      { vehicle: req.params.id },
      { $set: { vehicle: null } }
    );

    // Set the vehicle field to null in all related Intervention documents
    await Intervention.updateMany(
      { vehicle: req.params.id },
      { $set: { vehicle: null } }
    );

    await vehicle.deleteOne();
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
