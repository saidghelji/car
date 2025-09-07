"use strict";

/**
 * Initial migration (created by assistant) - creates primary tables.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tables (simplified, matching model fields where possible)
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      nomFr: { type: Sequelize.STRING, allowNull: false },
      prenomFr: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true },
      documents: { type: Sequelize.JSONB, defaultValue: [] },
      status: { type: Sequelize.ENUM('Actif','Inactif'), defaultValue: 'Actif' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('vehicles', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(uuid_generate_v4())') },
      matricule: { type: Sequelize.STRING },
      marque: { type: Sequelize.STRING },
      modele: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Additional tables are created via sync or other migrations; keep initial migration minimal.
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('customers');
  }
};
