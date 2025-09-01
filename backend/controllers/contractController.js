const asyncHandler = require('express-async-handler');
const Contract = require('../models/Contract');

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
  return (!nom || nom.trim() === '') &&
         (!nationalite || nationalite.trim() === '') &&
         (!dateNaissance || dateNaissance.trim() === '') &&
         (!adresse || adresse.trim() === '') &&
         (!telephone || telephone.trim() === '') &&
         (!adresseEtranger || adresseEtranger.trim() === '') &&
         (!permisNumero || permisNumero.trim() === '') &&
         (!permisDelivreLe || permisDelivreLe.trim() === '') &&
         (!passeportCin || passeportCin.trim() === '') &&
         (!passeportDelivreLe || passeportDelivreLe.trim() === '');
};

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
const getContracts = asyncHandler(async (req, res) => {
  const contracts = await Contract.find({}).populate('client').populate('vehicle'); // Removed .populate('secondDriver')
  res.status(200).json(contracts);
});

// @desc    Get single contract
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id).populate('client').populate('vehicle'); // Removed .populate('secondDriver')

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
    client, // This will be the client ID
    contractDate,
    departureDate,
  departureTime,
    returnDate,
    contractLocation,
    duration,
    pickupLocation,
    returnLocation,
    matricule,
    vehicle, // This will be the vehicle ID
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
    secondDriver, // This will now be an object with prenomFr, nomFr, etc.
    equipment,
    extension,
    documents, // Renamed from piecesJointes to match frontend formData
  } = req.body;

  console.log('createContract: req.body.returnLocation:', returnLocation); // Debug log

  // Generate contract number automatically
  const latestContract = await Contract.findOne().sort({ createdAt: -1 });
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

  const contract = new Contract({
    client: client, // Assign client ID directly
    contractNumber: newContractNumber, // Use the generated contract number
    contractDate,
    departureDate,
  departureTime,
    returnDate,
    contractLocation,
    duration,
    pickupLocation,
    returnLocation,
    matricule,
    vehicle: vehicle, // Assign vehicle ID directly
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
    secondDriver: isSecondDriverEmpty(parsedSecondDriver) ? null : parsedSecondDriver, // Assign parsed secondDriver, or null if empty
    equipment: parsedEquipment,
    extension: parsedExtension,
    piecesJointes: parsedDocuments, // Assign parsed documents
  });

  const createdContract = await contract.save();
  console.log('Backend: Created contract with ID:', createdContract._id, 'and contractNumber:', createdContract.contractNumber); // Debug log
  const populatedContract = await Contract.findById(createdContract._id).populate('client').populate('vehicle'); // Removed .populate('secondDriver')
  res.status(201).json(populatedContract);
});

// @desc    Update a contract
// @route   PUT /api/contracts/:id
// @access  Private
const updateContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    res.status(404);
    throw new Error('Contract not found');
  }

  const {
    client,
    // contractNumber, // Removed from destructuring as it should not be updated
    contractDate,
    departureDate,
  departureTime,
    returnDate,
    contractLocation,
    duration,
    pickupLocation,
    returnLocation, // Added returnLocation here
    matricule,
    vehicle, // This will be the vehicle ID
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
    secondDriver, // This will now be an object with prenomFr, nomFr, etc.
    equipment,
    extension,
    documents, // Renamed from piecesJointes to match frontend formData
  } = req.body;

  console.log('updateContract: req.body.returnLocation:', returnLocation); // Debug log

  try {
    // Parse complex objects that might be sent as JSON strings from formData
    const parsedEquipment = typeof equipment === 'string' ? JSON.parse(equipment) : equipment;
    const parsedExtension = typeof extension === 'string' ? JSON.parse(extension) : extension;
    const parsedDocuments = typeof documents === 'string' ? JSON.parse(documents) : documents;
    const parsedSecondDriver = typeof secondDriver === 'string' ? JSON.parse(secondDriver) : secondDriver;

    // Update fields only if they are provided in the request body
    if (client) contract.client = client;
    // contractNumber should not be updated after creation
    if (contractDate) contract.contractDate = contractDate;
    if (departureDate) contract.departureDate = departureDate;
  if (departureTime !== undefined) contract.departureTime = departureTime;
    if (returnDate) contract.returnDate = returnDate;
    if (contractLocation) contract.contractLocation = contractLocation;
    if (duration) contract.duration = duration;
    if (pickupLocation) contract.pickupLocation = pickupLocation;
    if (returnLocation !== undefined) contract.returnLocation = returnLocation;
    if (matricule) contract.matricule = matricule;
    if (vehicle) contract.vehicle = vehicle;
    if (pricePerDay) contract.pricePerDay = pricePerDay;
    if (startingKm) contract.startingKm = startingKm;
    if (discount) contract.discount = discount;
    if (fuelLevel) contract.fuelLevel = fuelLevel;
    if (total) contract.total = total;
    if (guarantee) contract.guarantee = guarantee;
    if (paymentType) contract.paymentType = paymentType;
    if (advance) contract.advance = advance;
    if (remaining) contract.remaining = remaining;
    if (status) contract.status = status;
    if (parsedSecondDriver) {
      contract.secondDriver = isSecondDriverEmpty(parsedSecondDriver) ? null : parsedSecondDriver;
    } else {
      contract.secondDriver = null;
    }
    if (parsedEquipment) {
      contract.equipment = parsedEquipment;
    }
    if (parsedExtension) contract.extension = parsedExtension;
    if (parsedDocuments) contract.piecesJointes = parsedDocuments;

    const updatedContract = await contract.save();
    console.log('Backend: updatedContract before sending response:', updatedContract); // Debug log
    const populatedContract = await Contract.findById(updatedContract._id).populate('client').populate('vehicle'); // Removed .populate('secondDriver')
    res.json(populatedContract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ message: 'Server error updating contract', error: error.message });
  }
});

// @desc    Delete a contract
// @route   DELETE /api/contracts/:id
// @access  Private
const deleteContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (contract) {
    await contract.deleteOne();
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
