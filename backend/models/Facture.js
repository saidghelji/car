// Legacy Mongoose model moved to models/legacy/Facture.js
console.warn('Warning: importing legacy Mongoose model Facture. Use Sequelize models instead.');
module.exports = require('./legacy/Facture.js');
