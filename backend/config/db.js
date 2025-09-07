const { connectSequelize } = require('./sequelize');

const connectDB = async () => {
  // Keep the function name connectDB for compatibility with server.js
  await connectSequelize();
};

module.exports = connectDB;
