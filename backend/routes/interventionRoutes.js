const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  deleteIntervention,
} = require('../controllers/interventionController');
const upload = require('../utils/upload');

router.route('/').get(getInterventions).post((req, res, next) => {
  upload.array('documents')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ message: err.message });
    }
    // Everything went fine.
    next();
  });
}, createIntervention);
router
  .route('/:id')
  .get(getInterventionById)
  .put((req, res, next) => {
    upload.array('documents')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: err.message });
      }
      next();
    });
  }, updateIntervention)
  .delete(deleteIntervention);

module.exports = router;
