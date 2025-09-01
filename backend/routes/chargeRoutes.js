const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getCharges,
  getChargeById,
  createCharge,
  updateCharge,
  deleteCharge,
} = require('../controllers/chargeController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.route('/').get(getCharges).post(upload.array('attachments'), createCharge);
router
  .route('/:id')
  .get(getChargeById)
  .put(upload.array('attachments'), updateCharge)
  .delete(deleteCharge);

module.exports = router;
