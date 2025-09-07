require('dotenv').config({ path: './.env' });

module.exports = {
  development: {
    url: process.env.DATABASE_URL || process.env.DB_URI || process.env.MONGO_URI || 'postgres://user:pass@localhost:5432/car_dev',
    dialect: 'postgres',
  },
  test: {
    url: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/car_test',
    dialect: 'postgres',
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
  }
};
