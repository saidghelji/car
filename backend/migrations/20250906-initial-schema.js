'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, STRING, INTEGER, FLOAT, DATE, JSONB, ENUM, BOOLEAN, TEXT } = Sequelize.DataTypes;

    await queryInterface.createTable('customers', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      nomFr: STRING,
      prenomFr: STRING,
      telephone: STRING,
      email: STRING,
      adresse: STRING,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('vehicles', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      matricule: STRING,
      brand: STRING,
      model: STRING,
      circulationDate: STRING,
      fuelType: STRING,
      fuelLevel: STRING,
      mileage: INTEGER,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('contracts', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      clientId: { type: UUID },
      contractNumber: STRING,
      contractDate: STRING,
      departureDate: STRING,
      returnDate: STRING,
      vehicleId: { type: UUID },
      matricule: STRING,
      total: FLOAT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('factures', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      clientId: { type: UUID },
      contractId: { type: UUID },
      invoiceNumber: STRING,
      totalTTC: FLOAT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('clientPayments', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      clientId: { type: UUID },
      contractId: { type: UUID },
      factureId: { type: UUID },
      accidentId: { type: UUID },
      paymentNumber: STRING,
      amountPaid: FLOAT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('accidents', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      contractId: { type: UUID },
      clientId: { type: UUID },
      vehicleId: { type: UUID },
      numeroContrat: STRING,
      description: TEXT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('infractions', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      vehicleId: { type: UUID },
      clientId: { type: UUID },
      infractionNumber: STRING,
      description: TEXT,
      amount: FLOAT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('interventions', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      vehicleId: { type: UUID },
      description: TEXT,
      date: STRING,
      cost: FLOAT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('vehicleInspections', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      vehicleId: { type: UUID },
      notes: TEXT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('vehicleInsurances', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      vehicleId: { type: UUID },
      provider: STRING,
      startDate: STRING,
      endDate: STRING,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('charges', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      motif: STRING,
      montant: FLOAT,
      observations: TEXT,
      createdAt: DATE,
      updatedAt: DATE,
    });

    await queryInterface.createTable('users', {
      id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
      name: STRING,
      email: STRING,
      password: STRING,
      role: STRING,
      createdAt: DATE,
      updatedAt: DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('charges');
    await queryInterface.dropTable('vehicleInsurances');
    await queryInterface.dropTable('vehicleInspections');
    await queryInterface.dropTable('interventions');
    await queryInterface.dropTable('infractions');
    await queryInterface.dropTable('accidents');
    await queryInterface.dropTable('clientPayments');
    await queryInterface.dropTable('factures');
    await queryInterface.dropTable('contracts');
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('customers');
  }
};
