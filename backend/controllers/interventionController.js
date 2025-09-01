const asyncHandler = require('express-async-handler');
const Intervention = require('../models/Intervention');

// @desc    Get all interventions
// @route   GET /api/interventions
// @access  Private
const getInterventions = asyncHandler(async (req, res) => {
  const interventions = await Intervention.find({}).populate('vehicle');
  res.status(200).json(interventions);
});

// @desc    Get single intervention
// @route   GET /api/interventions/:id
// @access  Private
const getInterventionById = asyncHandler(async (req, res) => {
  const intervention = await Intervention.findById(req.params.id).populate('vehicle');

  if (intervention) {
    res.json(intervention);
  } else {
    res.status(404);
    throw new Error('Intervention not found');
  }
});

// @desc    Create an intervention
// @route   POST /api/interventions
// @access  Private
const createIntervention = asyncHandler(async (req, res) => {
  console.log('Received request body:', req.body);
  console.log('Received files:', req.files);

  const { vehicle, description, date, cost, status, type, observation, currentMileage, nextMileage } = req.body;

  // Validate required fields
  if (!vehicle || !description || !date || !cost || !status || !type) {
    res.status(400);
    throw new Error('Please add all required fields: vehicle, description, date, cost, status, type');
  }

  // Validate date format
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    res.status(400);
    throw new Error('Invalid date format. Please provide a valid date.');
  }

  const documents = req.files && Array.isArray(req.files) ? req.files.map(file => ({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    url: file.path,
  })) : [];

  const intervention = new Intervention({
    vehicle,
    description,
    date: parsedDate, // Use the parsed Date object
    cost,
    status,
    type,
    observation,
    currentMileage,
    nextMileage,
    documents,
  });

  try {
    const createdIntervention = await intervention.save();
    await createdIntervention.populate('vehicle'); // Populate vehicle after saving
    res.status(201).json(createdIntervention);
  } catch (error) {
    console.error('Error saving intervention to database:', error);
    res.status(500);
    throw new Error('Failed to save intervention to database.');
  }
});

// @desc    Update an intervention
// @route   PUT /api/interventions/:id
// @access  Private
const updateIntervention = asyncHandler(async (req, res) => {
  console.log('--- updateIntervention START ---');
  console.log('Raw Request Body (before processing):', req.body); // Log raw body
  console.log('Raw Request Files:', req.files); // Log raw files

  // Explicitly remove 'documents' from req.body to prevent Mongoose casting issues
  // Multer handles file uploads, so 'documents' in req.body would be stringified form data.
  if (req.body.documents) {
    console.log("Deleting req.body.documents to prevent Mongoose CastError.");
    delete req.body.documents;
  }

  const intervention = await Intervention.findById(req.params.id);
  console.log('Found Intervention:', intervention ? intervention._id : 'Not found');
  console.log('Intervention object from DB before updates:', intervention); // Diagnostic log

  if (intervention) {
    // Update scalar fields. If a field is not provided in req.body, retain its existing value.
    intervention.vehicle = req.body.vehicle !== undefined ? req.body.vehicle : intervention.vehicle;
    intervention.description = req.body.description !== undefined ? req.body.description : intervention.description;
    
    // Handle date parsing if date is provided
    if (req.body.date !== undefined) {
      const parsedDate = new Date(req.body.date);
      if (!isNaN(parsedDate.getTime())) {
        intervention.date = parsedDate;
      } else {
        res.status(400);
        throw new Error('Invalid date format for update. Please provide a valid date.');
      }
    } 
    // If req.body.date is undefined, intervention.date retains its existing value by default.

    intervention.cost = req.body.cost !== undefined ? req.body.cost : intervention.cost;
    intervention.status = req.body.status !== undefined ? req.body.status : intervention.status;
    intervention.type = req.body.type !== undefined ? req.body.type : intervention.type;
    intervention.observation = req.body.observation !== undefined ? req.body.observation : intervention.observation;
    intervention.currentMileage = req.body.currentMileage !== undefined ? req.body.currentMileage : intervention.currentMileage;
    intervention.nextMileage = req.body.nextMileage !== undefined ? req.body.nextMileage : intervention.nextMileage;

    let finalDocuments = [];

    // 1. Add existing documents that are explicitly passed from the frontend
    let existingDocumentsFromFrontend = req.body.existingDocuments;
    if (existingDocumentsFromFrontend) {
      // If existingDocumentsFromFrontend is a string, try to parse it as JSON
      if (typeof existingDocumentsFromFrontend === 'string') {
        try {
          existingDocumentsFromFrontend = JSON.parse(existingDocumentsFromFrontend);
        } catch (e) {
          console.error('Failed to parse existingDocumentsFromFrontend as JSON:', e);
          // If parsing fails, treat it as a single string element or handle as error
          existingDocumentsFromFrontend = [existingDocumentsFromFrontend];
        }
      }
      const existingDocsArray = Array.isArray(existingDocumentsFromFrontend) ? existingDocumentsFromFrontend : [existingDocumentsFromFrontend];
      console.log('Existing Documents Array from Frontend (req.body.existingDocuments):', existingDocsArray);
      
      // Filter intervention.documents based on existingDocsArray, normalizing paths
      const retainedExistingDocs = intervention.documents.filter(doc => {
        const normalizedDocUrl = doc.url.replace(/\\/g, '/');
        const isIncluded = existingDocsArray.some(existingUrl => existingUrl.replace(/\\/g, '/') === normalizedDocUrl);
        return isIncluded;
      });
      finalDocuments = [...retainedExistingDocs];
      console.log('Documents retained from existing (after filtering):', finalDocuments);
    } else {
      console.log('No existing documents passed from frontend, starting with empty document array for retained docs.');
    }

    // 2. Add new documents from req.files
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newDocs = req.files.map(file => ({
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: file.path.replace(/\\/g, '/'), // Normalize path for new files
      }));
      console.log('New Documents from Multer (req.files):', newDocs);
      finalDocuments = [...finalDocuments, ...newDocs];
      console.log('finalDocuments after adding new files:', finalDocuments);
    } else {
      console.log('No new files received via Multer.');
    }
    
    // Assign the constructed array to the intervention's documents field
    intervention.documents = finalDocuments;
    console.log('Final Documents array assigned to Mongoose model:', intervention.documents);

    try {
      const updatedIntervention = await intervention.save();
      await updatedIntervention.populate('vehicle'); // Populate vehicle after saving
      console.log('Intervention updated successfully:', updatedIntervention._id);
      res.json(updatedIntervention);
    } catch (error) {
      console.error('Error saving updated intervention to database:', error);
      // Log the specific validation errors if available
      if (error.name === 'ValidationError') {
        console.error('Mongoose Validation Error Details:', error.errors);
      }
      res.status(500);
      throw new Error('Failed to save updated intervention to database.');
    }
  } else {
    res.status(404);
    throw new Error('Intervention not found');
  }
  console.log('--- updateIntervention END ---');
});

// @desc    Delete an intervention
// @route   DELETE /api/interventions/:id
// @access  Private
const deleteIntervention = asyncHandler(async (req, res) => {
  const intervention = await Intervention.findById(req.params.id);

  if (intervention) {
    await intervention.deleteOne();
    res.json({ message: 'Intervention removed' });
  } else {
    res.status(404);
    throw new Error('Intervention not found');
  }
});

module.exports = {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  deleteIntervention,
};
