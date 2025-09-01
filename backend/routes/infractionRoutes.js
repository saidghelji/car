const express = require('express');
const router = express.Router();
const {
  getInfractions,
  getInfractionById,
  createInfraction,
  updateInfraction,
  deleteInfraction,
  deleteInfractionDocument, // Import the new controller function
} = require('../controllers/infractionController');
const upload = require('../utils/upload'); // Import the upload middleware

router.route('/')
  .get(getInfractions)
  .post(upload.array('attachments', 10), createInfraction); // Use upload middleware for attachments

router.route('/:id')
  .get(getInfractionById)
  .put(upload.array('attachments', 10), updateInfraction) // Use upload middleware for attachments
  .delete(deleteInfraction);

router.route('/:id/documents')
  .delete(deleteInfractionDocument); // New route for deleting specific documents

module.exports = router;
