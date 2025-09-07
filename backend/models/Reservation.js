// Legacy Mongoose model moved to models/legacy/Reservation.js
console.warn('Warning: importing legacy Mongoose model Reservation. Use Sequelize models instead.');
module.exports = require('./legacy/Reservation.js');
