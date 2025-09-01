const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    username,
    password,
    role,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user
// @route   POST /api/users/login
// @access  Public
  const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Check for user username
  const user = await User.findOne({ username });

  console.log('Attempting login for user:', username);
  console.log('User found:', !!user);

  if (user && (await user.matchPassword(password))) {
    console.log('Password matched for user:', username);
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    console.log('Password did NOT match or user not found for:', username);
    res.status(401);
    throw new Error('Invalid username or password');
  }
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private (requires authentication)
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Get user from JWT (assuming auth middleware adds user to req)
  const user = await User.findById(req.user._id);

  if (user && (await user.matchPassword(oldPassword))) {
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } else {
    res.status(401);
    throw new Error('Invalid old password');
  }
});

module.exports = {
  registerUser,
  loginUser,
  changePassword,
};
