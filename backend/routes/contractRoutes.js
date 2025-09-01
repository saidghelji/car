const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For file system operations

const Contract = require('../models/Contract');
const Customer = require('../models/Customer'); // Import Customer model
const Vehicle = require('../models/Vehicle');     // Import Vehicle model

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

// Helper function to parse JSON strings from req.body
const parseJsonFields = (req, res, next) => {
  // Helper function to parse JSON strings from req.body and handle 'null' for secondDriver
  const fieldsToParse = ['vehicle', 'equipment', 'extension'];
  fieldsToParse.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        console.error(`Error parsing ${field}:`, e);
        return res.status(400).json({ msg: `Invalid ${field} data format` });
      }
    }
  });

  // Handle 'null' string for secondDriver
  if (req.body.secondDriver === 'null' || req.body.secondDriver === '') {
    req.body.secondDriver = null;
  } else if (req.body.secondDriver && typeof req.body.secondDriver === 'string') {
    try {
      req.body.secondDriver = JSON.parse(req.body.secondDriver);
    } catch (e) {
      console.error('Error parsing secondDriver string:', e);
      return res.status(400).json({ msg: 'Invalid secondDriver data format' });
    }
  } else if (req.body.secondDriver && Array.isArray(req.body.secondDriver)) {
    // If secondDriver is an array, take the first element and parse it
    if (req.body.secondDriver.length > 0) {
      try {
        req.body.secondDriver = JSON.parse(req.body.secondDriver[0]);
      } catch (e) {
        console.error('Error parsing secondDriver array element:', e);
        return res.status(400).json({ msg: 'Invalid secondDriver data format in array' });
      }
    } else {
      req.body.secondDriver = null;
    }
  }

  if (req.body.existingDocuments) {
    if (Array.isArray(req.body.existingDocuments)) {
      try {
        req.body.existingDocuments = req.body.existingDocuments.map(doc =>
          typeof doc === 'string' ? JSON.parse(doc) : doc
        );
      } catch (e) {
        console.error('Error parsing existingDocuments array:', e);
        return res.status(400).json({ msg: 'Invalid existingDocuments data format' });
      }
    } else if (typeof req.body.existingDocuments === 'string') {
      try {
        req.body.existingDocuments = JSON.parse(req.body.existingDocuments);
      } catch (e) {
        console.error('Error parsing existingDocuments string:', e);
        return res.status(400).json({ msg: 'Invalid existingDocuments data format' });
      }
    }
  }

  next();
};

// @route   GET api/contracts
// @desc    Get all contracts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('client', 'prenomFr nomFr numeroPermis permisValidite') // Populate client details
      .populate('secondDriver', 'prenomFr nomFr numeroPermis permisValidite'); // Populate second driver details
    res.json(contracts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/contracts/:id
// @desc    Get single contract by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('client', 'prenomFr nomFr numeroPermis permisValidite') // Populate client details
      .populate('secondDriver', 'prenomFr nomFr numeroPermis permisValidite'); // Populate second driver details
    if (!contract) {
      return res.status(404).json({ msg: 'Contract not found' });
    }
    res.json(contract);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Contract not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/contracts
// @desc    Add new contract
// @access  Public
router.post('/', upload.fields([{ name: 'documents', maxCount: 10 }]), parseJsonFields, async (req, res) => {
  console.log('Received POST request body:', req.body);
  const {
    client, contractDate, departureDate, departureTime, returnDate, returnLocation,
    contractLocation, duration, pickupLocation, matricule, vehicle,
    pricePerDay, startingKm, discount, fuelLevel, total, guarantee,
    paymentType, advance, remaining, status, secondDriver, equipment,
    extension
  } = req.body;

  console.log('Client ID (POST):', client);
  console.log('Vehicle object after parsing (POST):', vehicle);

  try {
    // Client and secondDriver are now expected to be just IDs
    if (!client) {
      console.error('Client ID missing (POST):', client);
      return res.status(400).json({ msg: 'Client ID is required.' });
    }
    if (!vehicle || (!vehicle.id && !vehicle._id)) {
      console.error('Vehicle ID missing or invalid (POST):', vehicle);
      return res.status(400).json({ msg: 'Vehicle ID is required.' });
    }

    const foundClient = await Customer.findById(client);
    if (!foundClient) {
      console.error('Client not found for ID:', client);
      return res.status(404).json({ msg: 'Client not found' });
    }

    // secondDriver is an embedded document, no need to find by ID
    // It should already be parsed into an object by parseJsonFields
    // If it's an empty object or has no meaningful data, set to null
    if (secondDriver && Object.keys(secondDriver).length === 0) {
      req.body.secondDriver = null;
    }

    const vehicleId = vehicle.id || vehicle._id;
    const foundVehicle = await Vehicle.findById(vehicleId);
    if (!foundVehicle) {
      console.error('Vehicle not found for ID:', vehicleId);
      return res.status(404).json({ msg: 'Vehicle not found' });
    }

    const piecesJointes = req.files && req.files['documents'] ?
      req.files['documents'].map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
      })) : [];

    // Generate contractNumber
    const latestContract = await Contract.findOne().sort({ createdAt: -1 });
    let newContractNumber = 'CON-00001';

    if (latestContract && latestContract.contractNumber) {
      const lastNumber = parseInt(latestContract.contractNumber.split('-')[1]);
      newContractNumber = `CON-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    const newContract = new Contract({
      client: foundClient._id, // Store only the client's ObjectId
      contractNumber: newContractNumber, // Assign the generated contract number
      contractDate, departureDate, departureTime, returnDate, returnLocation,
      contractLocation, duration, pickupLocation, matricule,
      vehicle: foundVehicle._id, // Store only the vehicle's ObjectId
      pricePerDay, startingKm, discount, fuelLevel, total, guarantee,
      paymentType, advance, remaining, status,
      secondDriver: secondDriver || undefined, // Store the embedded second driver object
      equipment,
      extension, piecesJointes
    });
    console.log('New Contract Data before save:', newContract);

    const contract = await newContract.save();
    // Populate client and secondDriver before sending response
    await contract.populate('client', 'prenomFr nomFr numeroPermis permisValidite');
    // secondDriver is an embedded document, no need to populate
    res.status(201).json(contract);
  } catch (err) {
    console.error('Error in POST /api/contracts:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/contracts/:id
// @desc    Update contract
// @access  Public
router.put('/:id', upload.fields([{ name: 'documents', maxCount: 10 }]), parseJsonFields, async (req, res) => {
  console.log('Received PUT request for ID:', req.params.id);
  console.log('Received PUT request body:', req.body);
  console.log('Received PUT request files:', req.files);
  const {
    client, contractDate, departureDate, departureTime, returnDate, returnLocation, // Removed contractNumber
    contractLocation, duration, pickupLocation, matricule, vehicle,
    pricePerDay, startingKm, discount, fuelLevel, total, guarantee,
    paymentType, advance, remaining, status, secondDriver, equipment,
    extension, existingDocuments
  } = req.body;

  console.log('Client ID (PUT):', client);
  console.log('Vehicle object after parsing (PUT):', vehicle);

  try {
    if (!client) {
      console.error('Client ID missing (PUT):', client);
      return res.status(400).json({ msg: 'Client ID is required.' });
    }
    if (!vehicle || (!vehicle.id && !vehicle._id)) {
      console.error('Vehicle ID missing or invalid (PUT):', vehicle);
      return res.status(400).json({ msg: 'Vehicle ID is required.' });
    }

    const foundClient = await Customer.findById(client);
    if (!foundClient) {
      console.error('Client not found for ID (PUT):', client);
      return res.status(404).json({ msg: 'Client not found' });
    }

    // secondDriver is an embedded document, no need to find by ID
    // It should already be parsed into an object by parseJsonFields
    // If it's an empty object or has no meaningful data, set to null
    if (secondDriver && Object.keys(secondDriver).length === 0) {
      req.body.secondDriver = null;
    }

    const vehicleId = vehicle.id || vehicle._id;
    const foundVehicle = await Vehicle.findById(vehicleId);
    if (!foundVehicle) {
      console.error('Vehicle not found for ID (PUT):', vehicleId);
      return res.status(404).json({ msg: 'Vehicle not found' });
    }

    let updatedPiecesJointes = [];

    console.log('Raw existingDocuments from req.body:', req.body.existingDocuments);
    if (existingDocuments && Array.isArray(existingDocuments)) {
      updatedPiecesJointes = existingDocuments.map(doc => {
        try {
          return doc; // existingDocuments are already parsed by parseJsonFields
        } catch (e) {
          console.error('Error processing existing document:', doc, e);
          return null;
        }
      }).filter(Boolean);
    }
    console.log('Processed existingDocuments:', updatedPiecesJointes);

    if (req.files && req.files['documents']) {
      const newDocuments = req.files['documents'].map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
      }));
      updatedPiecesJointes = [...updatedPiecesJointes, ...newDocuments];
      console.log('Newly uploaded documents:', newDocuments);
    }
    console.log('Final updatedPiecesJointes:', updatedPiecesJointes);

    const contractFields = {
      client: foundClient._id, // Store only the client's ObjectId
      contractDate, departureDate, departureTime, returnDate, returnLocation, // Removed contractNumber
      contractLocation, duration, pickupLocation, matricule,
      vehicle: foundVehicle._id, // Store only the vehicle's ObjectId
      pricePerDay, startingKm, discount, fuelLevel, total, guarantee,
      paymentType, advance, remaining, status,
      secondDriver: secondDriver || undefined, // Store the embedded second driver object
      equipment,
      extension, piecesJointes: updatedPiecesJointes
    };
    console.log('Contract Fields before update (PUT):', contractFields);

    let contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ msg: 'Contract not found' });
    }

    contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { $set: contractFields },
      { new: true }
    );

    // Populate client and secondDriver before sending response
    await contract.populate('client', 'prenomFr nomFr numeroPermis permisValidite');
    // secondDriver is an embedded document, no need to populate
    res.json(contract);
  } catch (err) {
    console.error('Error in PUT /api/contracts/:id:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/contracts/:id/documents
// @desc    Delete a specific document from a contract
// @access  Public
router.delete('/:id/documents', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ msg: 'Contract not found' });
    }

    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({ msg: 'Document URL is required.' });
    }

    // Remove the document from the piecesJointes array
    const updatedPiecesJointes = contract.piecesJointes.filter(
      (doc) => doc.url !== documentUrl
    );

    if (updatedPiecesJointes.length === contract.piecesJointes.length) {
      return res.status(404).json({ msg: 'Document not found in contract.' });
    }

    contract.piecesJointes = updatedPiecesJointes;
    await contract.save();

    // Optionally, delete the file from the server's uploads directory
    const filePath = path.join(__dirname, '..', documentUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ msg: 'Document removed successfully', contract });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Contract not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/contracts/:id
// @desc    Delete contract
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ msg: 'Contract not found' });
    }

    await Contract.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Contract removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Contract not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
