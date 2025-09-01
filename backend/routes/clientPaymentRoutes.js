const express = require('express');
const router = express.Router();
const {
  getClientPayments,
  getClientPaymentById,
  createClientPayment,
  updateClientPayment,
  deleteClientPayment,
  removePaymentDocument,
} = require('../controllers/clientPaymentController');
const upload = require('../utils/upload'); // Import the upload middleware

router.route('/').get(getClientPayments).post(upload.array('documents', 10), createClientPayment);
router.route('/:id').get(getClientPaymentById).put(upload.array('documents', 10), updateClientPayment).delete(deleteClientPayment);
router.route('/:id/documents').delete(removePaymentDocument);

module.exports = router;
