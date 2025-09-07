const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './.env' });

// Allow selecting dialect via environment for local smoke tests.
// Use DB_DIALECT=sqlite and DATABASE_URL or SQLITE_STORAGE when you want an in-memory or file sqlite DB.
const dialect = process.env.DB_DIALECT || 'postgres';

let sequelize;
if (dialect === 'sqlite') {
  // Use in-memory by default unless SQLITE_STORAGE is provided
  const storage = process.env.SQLITE_STORAGE || ':memory:';
  sequelize = new Sequelize({ dialect: 'sqlite', storage, logging: false });
} else {
  // Postgres (default)
  const connectionString = process.env.DATABASE_URL || process.env.DB_URI;
  if (!connectionString) {
    console.error('No DATABASE_URL defined in environment. Please set DATABASE_URL in .env');
  }
  sequelize = new Sequelize(connectionString, { dialect: 'postgres', logging: false });
}

const connectSequelize = async () => {
  try {
    await sequelize.authenticate();
    console.log(`${dialect} (Sequelize) connected.`);
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectSequelize };
