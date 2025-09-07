// Legacy Mongoose model moved to models/legacy/ClientPayment.js
console.warn('Warning: importing legacy Mongoose model ClientPayment. Use Sequelize models instead.');
module.exports = require('./legacy/ClientPayment.js');
