const express = require('express');
const router = express.Router();
const {
  getVehicleInspections,
  getVehicleInspectionById,
  createVehicleInspection,
  updateVehicleInspection,
  deleteVehicleInspection,
  removeInspectionDocument,
} = require('../controllers/vehicleInspectionController');
const upload = require('../utils/upload'); // Import the upload middleware

router.route('/').get(getVehicleInspections).post(upload.array('documents'), createVehicleInspection);
router.route('/:id')
  .get(getVehicleInspectionById)
  .put(upload.array('documents'), updateVehicleInspection)
  .delete(deleteVehicleInspection);

router.route('/:id/documents').delete(removeInspectionDocument);

module.exports = router;
