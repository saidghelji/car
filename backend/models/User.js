// Legacy Mongoose model moved to models/legacy/User.js
console.warn('Warning: importing legacy Mongoose model User. Use Sequelize models instead.');
module.exports = require('./legacy/User.js');
