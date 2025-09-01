const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support both DB_URI and MONGO_URI environment variable names.
    const uri = process.env.DB_URI || process.env.MONGO_URI;
  let which = 'none';
  if (process.env.DB_URI) which = 'DB_URI';
  else if (process.env.MONGO_URI) which = 'MONGO_URI';
  console.log('Using DB env var:', which);

    if (!uri) {
      throw new Error('No MongoDB URI defined in environment (DB_URI or MONGO_URI).');
    }

    await mongoose.connect(uri);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
