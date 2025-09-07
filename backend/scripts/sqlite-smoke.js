const { sequelize } = require('../config/sequelize');
const { Customer, Vehicle, Contract } = require('../models');

async function run() {
  try {
    console.log('Syncing models (force: true) on sqlite in-memory...');
    await sequelize.sync({ force: true });

    console.log('Creating sample Customer and Vehicle...');
    const customer = await Customer.create({ nomFr: 'Doe', prenomFr: 'John', email: 'john.doe@example.com' });
  // Create a vehicle with required fields according to Vehicle.model.js
  const vehicle = await Vehicle.create({ chassisNumber: 'CHASSIS-001', licensePlate: 'ABC-123', brand: 'Toyota', model: 'Corolla' });

    console.log('Creating Contract that links customer and vehicle...');
  const now = new Date().toISOString();
  const contract = await Contract.create({ clientId: customer.id, vehicleId: vehicle.id, contractNumber: 'SMOKE-1', contractDate: now, departureDate: now, returnDate: now, matricule: vehicle.licensePlate });

    console.log('Fetching contract with includes...');
    const fetched = await Contract.findByPk(contract.id, { include: [ { model: Customer, as: 'client' }, { model: Vehicle, as: 'vehicle' } ] });

    console.log('Fetched contract:');
    console.log(JSON.stringify(fetched.toJSON(), null, 2));

    console.log('Smoke test passed.');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
}

run();
