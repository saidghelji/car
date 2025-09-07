const User = require('../models/User.model');
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
  const userExists = await User.findOne({ where: { username } });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({ username, password, role });

  if (user) {
    res.status(201).json({
      id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id),
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
  const user = await User.findOne({ where: { username } });

  console.log('Attempting login for user:', username);
  console.log('User found:', !!user);

  if (user && (await user.matchPassword(password))) {
    console.log('Password matched for user:', username);
    res.json({
  id: user.id,
  username: user.username,
  role: user.role,
  token: generateToken(user.id),
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
  const user = await User.findByPk(req.user.id);

  if (user && (await user.matchPassword(oldPassword))) {
  user.password = newPassword;
  await user.save();
    res.json({ message: 'Password changed successfully' });
  } else {
    res.status(401);
    throw new Error('Invalid old password');
  }
});

// @desc    Update user username
// @route   PUT /api/users/update-username
// @access  Private (requires authentication)
const updateUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;

  // Get user from JWT (assuming auth middleware adds user to req)
  const user = await User.findByPk(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!username) {
    res.status(400);
    throw new Error('Please provide a new username');
  }

  // Check if new username already exists
  const usernameExists = await User.findOne({ username });
  if (usernameExists && usernameExists.id !== user.id) {
    res.status(400);
    throw new Error('Username already taken');
  }

  user.username = username;
  await user.save();

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
  });
});

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  updateUsername,
};
