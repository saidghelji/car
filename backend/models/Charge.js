// Legacy Mongoose model moved to models/legacy/Charge.js
console.warn('Warning: importing legacy Mongoose model Charge. Use Sequelize models instead.');
module.exports = require('./legacy/Charge.js');
