const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword, updateUsername } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // We will create this middleware next

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);
router.put('/update-username', protect, updateUsername);

module.exports = router;
