const express = require('express');
const router = express.Router();
const {
  getFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
} = require('../controllers/factureController');

router.route('/').get(getFactures).post(createFacture);
router.route('/:id').get(getFactureById).put(updateFacture).delete(deleteFacture);

module.exports = router;
