const asyncHandler = require('express-async-handler');
const Contract = require('../models/Contract.model');
const { Customer, Vehicle } = require('../models');

// Helper function to check if a second driver object is effectively empty
const isSecondDriverEmpty = (secondDriver) => {
  if (!secondDriver) return true;
  const {
    nom,
    nationalite,
    dateNaissance,
    adresse,
    telephone,
    adresseEtranger,
    permisNumero,
    permisDelivreLe,
    passeportCin,
    passeportDelivreLe,
  } = secondDriver;
  return (!nom || String(nom).trim() === '') &&
         (!nationalite || String(nationalite).trim() === '') &&
         (!dateNaissance || String(dateNaissance).trim() === '') &&
         (!adresse || String(adresse).trim() === '') &&
         (!telephone || String(telephone).trim() === '') &&
         (!adresseEtranger || String(adresseEtranger).trim() === '') &&
         (!permisNumero || String(permisNumero).trim() === '') &&
         (!permisDelivreLe || String(permisDelivreLe).trim() === '') &&
         (!passeportCin || String(passeportCin).trim() === '') &&
         (!passeportDelivreLe || String(passeportDelivreLe).trim() === '');
};

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
const getContracts = asyncHandler(async (req, res) => {
  const contracts = await Contract.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: Customer, as: 'client' },
      { model: Vehicle, as: 'vehicle' },
    ],
  });
  res.status(200).json(contracts);
});

// @desc    Get single contract
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'client' },
      { model: Vehicle, as: 'vehicle' },
    ],
  });
  if (contract) {
    res.json(contract);
  } else {
    res.status(404);
    throw new Error('Contract not found');
  }
});

// @desc    Create a contract
// @route   POST /api/contracts
// @access  Private
const createContract = asyncHandler(async (req, res) => {
  const {
    client,
    contractDate,
    departureDate,
    departureTime,
    returnDate,
    contractLocation,
    duration,
    pickupLocation,
    returnLocation,
    matricule,
    vehicle,
    pricePerDay,
    startingKm,
    discount,
    fuelLevel,
    total,
    guarantee,
    paymentType,
    advance,
    remaining,
    status,
    secondDriver,
    equipment,
    extension,
    documents,
  } = req.body;

  // Generate contract number automatically
  const latestContract = await Contract.findOne({ order: [['createdAt', 'DESC']] });
  let newContractNumber = 'Noc-00001';

  if (latestContract && latestContract.contractNumber) {
    const lastNumber = parseInt(latestContract.contractNumber.split('-')[1]);
    newContractNumber = `Noc-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  // Parse complex objects that might be sent as JSON strings from formData
  const parsedEquipment = typeof equipment === 'string' ? JSON.parse(equipment) : equipment;
  const parsedExtension = typeof extension === 'string' ? JSON.parse(extension) : extension;
  const parsedDocuments = typeof documents === 'string' ? JSON.parse(documents) : documents;
  const parsedSecondDriver = typeof secondDriver === 'string' ? JSON.parse(secondDriver) : secondDriver;

  const payload = {
    clientId: client,
    contractNumber: newContractNumber,
    contractDate,
    departureDate,
    departureTime,
    returnDate,
    contractLocation,
    duration,
    pickupLocation,
    returnLocation,
    matricule,
    vehicleId: vehicle,
    pricePerDay,
    startingKm,
    discount,
    fuelLevel,
    total,
    guarantee,
    paymentType,
    advance,
    remaining,
    status,
    secondDriver: isSecondDriverEmpty(parsedSecondDriver) ? null : parsedSecondDriver,
    equipment: parsedEquipment,
    extension: parsedExtension,
    piecesJointes: parsedDocuments,
  };
  console.log('Contract.create payload:', payload);
  let createdContract;
  try {
    createdContract = await Contract.create(payload);
  } catch (err) {
    console.error('Contract.create error:', err);
    const dbErr = err.parent || err.original || err;
    return res.status(500).json({ message: err.message, dbError: dbErr, payload });
  }

  const populated = await Contract.findByPk(createdContract.id, { include: [{ model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' }] });
  res.status(201).json(populated);
});

// @desc    Update a contract
// @route   PUT /api/contracts/:id
// @access  Private
const updateContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findByPk(req.params.id);

  if (!contract) {
    res.status(404);
    throw new Error('Contract not found');
  }

  const {
    client,
    contractDate,
    departureDate,
    departureTime,
    returnDate,
    contractLocation,
    duration,
    pickupLocation,
    returnLocation,
    matricule,
    vehicle,
    pricePerDay,
    startingKm,
    discount,
    fuelLevel,
    total,
    guarantee,
    paymentType,
    advance,
    remaining,
    status,
    secondDriver,
    equipment,
    extension,
    documents,
  } = req.body;

  // Parse complex objects that might be sent as JSON strings from formData
  const parsedEquipment = typeof equipment === 'string' ? JSON.parse(equipment) : equipment;
  const parsedExtension = typeof extension === 'string' ? JSON.parse(extension) : extension;
  const parsedDocuments = typeof documents === 'string' ? JSON.parse(documents) : documents;
  const parsedSecondDriver = typeof secondDriver === 'string' ? JSON.parse(secondDriver) : secondDriver;

  const updates = {};
  if (client !== undefined) updates.clientId = client;
  if (contractDate !== undefined) updates.contractDate = contractDate;
  if (departureDate !== undefined) updates.departureDate = departureDate;
  if (departureTime !== undefined) updates.departureTime = departureTime;
  if (returnDate !== undefined) updates.returnDate = returnDate;
  if (contractLocation !== undefined) updates.contractLocation = contractLocation;
  if (duration !== undefined) updates.duration = duration;
  if (pickupLocation !== undefined) updates.pickupLocation = pickupLocation;
  if (returnLocation !== undefined) updates.returnLocation = returnLocation;
  if (matricule !== undefined) updates.matricule = matricule;
  if (vehicle !== undefined) updates.vehicleId = vehicle;
  if (pricePerDay !== undefined) updates.pricePerDay = pricePerDay;
  if (startingKm !== undefined) updates.startingKm = startingKm;
  if (discount !== undefined) updates.discount = discount;
  if (fuelLevel !== undefined) updates.fuelLevel = fuelLevel;
  if (total !== undefined) updates.total = total;
  if (guarantee !== undefined) updates.guarantee = guarantee;
  if (paymentType !== undefined) updates.paymentType = paymentType;
  if (advance !== undefined) updates.advance = advance;
  if (remaining !== undefined) updates.remaining = remaining;
  if (status !== undefined) updates.status = status;
  if (parsedSecondDriver !== undefined) updates.secondDriver = isSecondDriverEmpty(parsedSecondDriver) ? null : parsedSecondDriver;
  if (parsedEquipment !== undefined) updates.equipment = parsedEquipment;
  if (parsedExtension !== undefined) updates.extension = parsedExtension;
  if (parsedDocuments !== undefined) updates.piecesJointes = parsedDocuments;

  await contract.update(updates);

  const populated = await Contract.findByPk(contract.id, { include: [{ model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' }] });
  res.json(populated);
});

// @desc    Delete a contract
// @route   DELETE /api/contracts/:id
// @access  Private
const deleteContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findByPk(req.params.id);

  if (contract) {
    await contract.destroy();
    res.json({ message: 'Contract removed' });
  } else {
    res.status(404);
    throw new Error('Contract not found');
  }
});

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
};
