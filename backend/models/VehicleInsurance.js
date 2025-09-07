// Legacy Mongoose model moved to models/legacy/VehicleInsurance.js
// To avoid accidental use, require('./models/legacy/VehicleInsurance.js') instead.
console.warn('Warning: importing legacy Mongoose model VehicleInsurance. Use Sequelize models instead.');
module.exports = require('./legacy/VehicleInsurance.js');
