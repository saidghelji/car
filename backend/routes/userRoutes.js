const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // We will create this middleware next

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);

module.exports = router;
