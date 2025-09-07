// Legacy Mongoose model moved to models/legacy/Vehicle.js
console.warn('Warning: importing legacy Mongoose model Vehicle. Use Sequelize models instead.');
module.exports = require('./legacy/Vehicle.js');
