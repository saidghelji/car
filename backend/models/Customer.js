// Legacy Mongoose model moved to models/legacy/Customer.js
console.warn('Warning: importing legacy Mongoose model Customer. Use Sequelize models instead.');
module.exports = require('./legacy/Customer.js');
