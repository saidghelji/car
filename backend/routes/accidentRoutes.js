const express = require('express');
const router = express.Router();
const {
  getAccidents,
  getAccidentById,
  createAccident,
  updateAccident,
  deleteAccident,
  deleteDocument,
  upload, // Import multer instance from controller
} = require('../controllers/accidentController');

router.route('/').get(getAccidents).post(upload.array('attachments'), createAccident);
router.route('/:id').get(getAccidentById).put(upload.array('attachments'), updateAccident).delete(deleteAccident);
router.route('/:id/documents').delete(deleteDocument);

module.exports = router;
