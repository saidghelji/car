const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getVehicleInsurances,
  getVehicleInsuranceById,
  createVehicleInsurance,
  updateVehicleInsurance,
  deleteVehicleInsurance,
  deleteInsuranceDocument,
} = require('../controllers/vehicleInsuranceController');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images and PDFs only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.route('/').get(getVehicleInsurances).post(upload.array('attachments', 10), createVehicleInsurance);
router.route('/:id').get(getVehicleInsuranceById).put(upload.array('attachments', 10), updateVehicleInsurance).delete(deleteVehicleInsurance);
router.route('/:id/documents').delete(deleteInsuranceDocument);

module.exports = router;
