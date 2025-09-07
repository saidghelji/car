const { sequelize } = require('../config/sequelize');
const { User, Customer } = require('../models');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected for seeding');

    // Create admin user if not exists
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      await User.create({ username: 'admin', password: 'changeme', role: 'admin' });
      console.log('Created admin user (username: admin, password: changeme)');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample customers if not exists
    const count = await Customer.count();
    if (count === 0) {
      await Customer.bulkCreate([
        { nomFr: 'Doe', prenomFr: 'John', email: 'john.doe@example.com', type: 'Particulier', status: 'Actif' },
        { nomFr: 'TestCust', prenomFr: 'Tony', email: 'tony.test@example.com', type: 'Particulier', status: 'Actif' },
      ]);
      console.log('Inserted sample customers');
    } else {
      console.log(`Customers count = ${count}, skipping sample insert`);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
};

run();
