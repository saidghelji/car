// Legacy Mongoose model moved to models/legacy/Accident.js
console.warn('Warning: importing legacy Mongoose model Accident. Use Sequelize models instead.');
module.exports = require('./legacy/Accident.js');
