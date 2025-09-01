const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// @route   GET api/vehicles
// @desc    Get all vehicles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/vehicles/:id
// @desc    Get single vehicle by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/vehicles
// @desc    Add new vehicle
// @access  Public
router.post('/', async (req, res) => {
  const {
    chassisNumber, imageUrl, temporaryPlate, licensePlate, brand, model,
    circulationDate, fuelType, fuelLevel, mileage, color,
    colorCode, rentalPrice, nombreDePlaces, nombreDeVitesses, transmission, statut, observation, equipment, documents,
    autorisationDate, autorisationValidity, carteGriseDate, carteGriseValidity
  } = req.body;

  try {
    const newVehicle = new Vehicle({
      chassisNumber, imageUrl, temporaryPlate, licensePlate, brand, model,
      circulationDate, fuelType, fuelLevel, mileage, color,
      colorCode, rentalPrice, nombreDePlaces, nombreDeVitesses, transmission, statut, observation, equipment, documents,
      autorisationDate, autorisationValidity, carteGriseDate, carteGriseValidity
    });

    const vehicle = await newVehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/vehicles/:id
// @desc    Update vehicle
// @access  Public
router.put('/:id', async (req, res) => {
  const {
    chassisNumber, imageUrl, temporaryPlate, licensePlate, brand, model,
    circulationDate, fuelType, fuelLevel, mileage, color,
    colorCode, rentalPrice, nombreDePlaces, nombreDeVitesses, transmission, statut, observation, equipment, documents,
    autorisationDate, autorisationValidity, carteGriseDate, carteGriseValidity
  } = req.body;

  const vehicleFields = {
    chassisNumber, imageUrl, temporaryPlate, licensePlate, brand, model,
    circulationDate, fuelType, fuelLevel, mileage, color,
    colorCode, rentalPrice, nombreDePlaces, nombreDeVitesses, transmission, statut, observation, equipment, documents,
    autorisationDate, autorisationValidity, carteGriseDate, carteGriseValidity
  };

  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }

    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: vehicleFields },
      { new: true }
    );

    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/vehicles/:id
// @desc    Delete vehicle
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Vehicle removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
