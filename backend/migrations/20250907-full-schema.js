"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
  // Ensure uuid extension is available
  await queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");

  // Create enums used by models if they don't already exist
    await queryInterface.sequelize.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_customers_type') THEN
        CREATE TYPE enum_customers_type AS ENUM ('Particulier','Professionel');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_customers_status') THEN
        CREATE TYPE enum_customers_status AS ENUM ('Actif','Inactif');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_contracts_fuellevel') THEN
        CREATE TYPE enum_contracts_fuelLevel AS ENUM ('reserve','1/4','1/2','3/4','plein');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_contracts_paymenttype') THEN
        CREATE TYPE enum_contracts_paymentType AS ENUM ('espece','cheque','carte_bancaire','virement');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_contracts_status') THEN
        CREATE TYPE enum_contracts_status AS ENUM ('en_cours','retournee');
      END IF;
    END$$;`);

    // customers
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      civilite: { type: Sequelize.STRING },
      nationalite: { type: Sequelize.STRING },
      type: { type: 'enum_customers_type', defaultValue: 'Particulier' },
      listeNoire: { type: Sequelize.BOOLEAN, defaultValue: false },
      nomFr: { type: Sequelize.STRING, allowNull: false },
      nomAr: { type: Sequelize.STRING },
      prenomFr: { type: Sequelize.STRING, allowNull: false },
      prenomAr: { type: Sequelize.STRING },
      dateNaissance: { type: Sequelize.STRING },
      age: { type: Sequelize.STRING },
      lieuNaissance: { type: Sequelize.STRING },
      ice: { type: Sequelize.STRING },
      cin: { type: Sequelize.STRING, unique: true },
      cinDelivreLe: { type: Sequelize.STRING },
      cinDelivreA: { type: Sequelize.STRING },
      cinValidite: { type: Sequelize.STRING },
      numeroPermis: { type: Sequelize.STRING, unique: true },
      permisDelivreLe: { type: Sequelize.STRING },
      permisDelivreA: { type: Sequelize.STRING },
      permisValidite: { type: Sequelize.STRING },
      numeroPasseport: { type: Sequelize.STRING, unique: true },
      passportDelivreLe: { type: Sequelize.STRING },
      passportDelivreA: { type: Sequelize.STRING },
      passportValidite: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true },
      adresseFr: { type: Sequelize.STRING },
      ville: { type: Sequelize.STRING },
      adresseAr: { type: Sequelize.STRING },
      codePostal: { type: Sequelize.STRING },
      telephone: { type: Sequelize.STRING },
      telephone2: { type: Sequelize.STRING },
      fix: { type: Sequelize.STRING },
      fax: { type: Sequelize.STRING },
      remarque: { type: Sequelize.STRING },
      documents: { type: Sequelize.JSONB, defaultValue: [] },
      totalRentals: { type: Sequelize.INTEGER, defaultValue: 0 },
      status: { type: 'enum_customers_status', defaultValue: 'Actif' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // vehicles
    await queryInterface.createTable('vehicles', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      chassisNumber: { type: Sequelize.STRING },
      imageUrl: { type: Sequelize.STRING },
      temporaryPlate: { type: Sequelize.STRING },
      licensePlate: { type: Sequelize.STRING },
      brand: { type: Sequelize.STRING },
      model: { type: Sequelize.STRING },
      circulationDate: { type: Sequelize.STRING },
      fuelType: { type: Sequelize.STRING },
      fuelLevel: { type: Sequelize.STRING },
      mileage: { type: Sequelize.INTEGER, defaultValue: 0 },
      color: { type: Sequelize.STRING },
      colorCode: { type: Sequelize.STRING },
      rentalPrice: { type: Sequelize.FLOAT, defaultValue: 0 },
      nombreDePlaces: { type: Sequelize.INTEGER, defaultValue: 0 },
      nombreDeVitesses: { type: Sequelize.INTEGER, defaultValue: 0 },
      transmission: { type: Sequelize.STRING },
      observation: { type: Sequelize.STRING },
      equipment: { type: Sequelize.JSONB, defaultValue: {} },
      documents: { type: Sequelize.JSONB, defaultValue: [] },
      autorisationDate: { type: Sequelize.STRING },
      autorisationValidity: { type: Sequelize.STRING },
      carteGriseDate: { type: Sequelize.STRING },
      carteGriseValidity: { type: Sequelize.STRING },
      statut: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // contracts
    await queryInterface.createTable('contracts', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      clientId: { type: Sequelize.UUID, allowNull: false },
      contractNumber: { type: Sequelize.STRING, unique: true },
      contractDate: { type: Sequelize.STRING, allowNull: false },
      departureDate: { type: Sequelize.STRING, allowNull: false },
      departureTime: { type: Sequelize.STRING },
      returnDate: { type: Sequelize.STRING, allowNull: false },
      contractLocation: { type: Sequelize.STRING },
      duration: { type: Sequelize.INTEGER, defaultValue: 0 },
      pickupLocation: { type: Sequelize.STRING },
      returnLocation: { type: Sequelize.STRING },
      matricule: { type: Sequelize.STRING, allowNull: false },
      vehicleId: { type: Sequelize.UUID, allowNull: false },
      pricePerDay: { type: Sequelize.FLOAT, defaultValue: 0 },
      startingKm: { type: Sequelize.INTEGER, defaultValue: 0 },
      discount: { type: Sequelize.FLOAT, defaultValue: 0 },
      fuelLevel: { type: 'enum_contracts_fuelLevel', defaultValue: 'plein' },
      total: { type: Sequelize.FLOAT, defaultValue: 0 },
      guarantee: { type: Sequelize.FLOAT, defaultValue: 0 },
      paymentType: { type: 'enum_contracts_paymentType', defaultValue: 'espece' },
      advance: { type: Sequelize.FLOAT, defaultValue: 0 },
      remaining: { type: Sequelize.FLOAT, defaultValue: 0 },
      status: { type: 'enum_contracts_status', defaultValue: 'en_cours' },
      secondDriver: { type: Sequelize.JSONB },
      equipment: { type: Sequelize.JSONB },
      extension: { type: Sequelize.JSONB },
      piecesJointes: { type: Sequelize.JSONB, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // factures
    await queryInterface.createTable('factures', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      invoiceNumber: { type: Sequelize.STRING },
      invoiceDate: { type: Sequelize.STRING },
      dueDate: { type: Sequelize.STRING },
      clientId: { type: Sequelize.UUID },
      contractId: { type: Sequelize.UUID },
      location: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING },
      montantHT: { type: Sequelize.FLOAT, defaultValue: 0 },
      tvaAmount: { type: Sequelize.FLOAT, defaultValue: 0 },
      tvaPercentage: { type: Sequelize.FLOAT, defaultValue: 0 },
      totalTTC: { type: Sequelize.FLOAT, defaultValue: 0 },
      paymentType: { type: Sequelize.STRING },
      amountPaid: { type: Sequelize.FLOAT, defaultValue: 0 },
      status: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // clientpayments
    await queryInterface.createTable('clientpayments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      clientId: { type: Sequelize.UUID },
      contractId: { type: Sequelize.UUID },
      factureId: { type: Sequelize.UUID },
      accidentId: { type: Sequelize.UUID },
      amount: { type: Sequelize.FLOAT, defaultValue: 0 },
      method: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // accidents
    await queryInterface.createTable('accidents', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      contractId: { type: Sequelize.UUID },
      clientId: { type: Sequelize.UUID },
      vehicleId: { type: Sequelize.UUID },
      description: { type: Sequelize.STRING },
      photos: { type: Sequelize.JSONB, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // infractions
    await queryInterface.createTable('infractions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      vehicleId: { type: Sequelize.UUID },
      customerId: { type: Sequelize.UUID },
      description: { type: Sequelize.STRING },
      montant: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // interventions
    await queryInterface.createTable('interventions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      vehicleId: { type: Sequelize.UUID },
      description: { type: Sequelize.STRING },
      cost: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // reservations
    await queryInterface.createTable('reservations', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      customerId: { type: Sequelize.UUID },
      vehicleId: { type: Sequelize.UUID },
      startDate: { type: Sequelize.STRING },
      endDate: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // charges
    await queryInterface.createTable('charges', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      description: { type: Sequelize.STRING },
      amount: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // traites
    await queryInterface.createTable('traites', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      vehicleId: { type: Sequelize.UUID },
      month: { type: Sequelize.INTEGER },
      amount: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // vehicleinspections
    await queryInterface.createTable('vehicleinspections', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      vehicleId: { type: Sequelize.UUID },
      notes: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // vehicleinsurances
    await queryInterface.createTable('vehicleinsurances', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      vehicleId: { type: Sequelize.UUID },
      customerId: { type: Sequelize.UUID },
      policyNumber: { type: Sequelize.STRING },
      startDate: { type: Sequelize.STRING },
      endDate: { type: Sequelize.STRING },
      premium: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      name: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true },
      password: { type: Sequelize.STRING },
      role: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('vehicleinsurances');
    await queryInterface.dropTable('vehicleinspections');
    await queryInterface.dropTable('traites');
    await queryInterface.dropTable('charges');
    await queryInterface.dropTable('reservations');
    await queryInterface.dropTable('interventions');
    await queryInterface.dropTable('infractions');
    await queryInterface.dropTable('accidents');
    await queryInterface.dropTable('clientpayments');
    await queryInterface.dropTable('factures');
    await queryInterface.dropTable('contracts');
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('customers');

    // drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contracts_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contracts_paymentType');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contracts_fuelLevel');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_customers_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_customers_type');
  }
};
