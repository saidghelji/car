const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const upload = require('../utils/upload'); // Import the upload middleware

// @route   GET api/customers
// @desc    Get all customers
// @access  Public
router.get('/', getCustomers);

// @route   GET api/customers/:id
// @desc    Get single customer by ID
// @access  Public
router.get('/:id', getCustomerById);

// @route   POST api/customers
// @desc    Add new customer
// @access  Public
router.post('/', upload.array('documents'), createCustomer); // Apply upload middleware and use controller function

// @route   PUT api/customers/:id
// @desc    Update customer
// @access  Public
router.put('/:id', upload.array('documents'), updateCustomer); // Apply upload middleware and use controller function

// @route   DELETE api/customers/:id
// @desc    Delete customer
// @access  Public
router.delete('/:id', deleteCustomer); // Use controller function

module.exports = router;
