// Legacy Mongoose model moved to models/legacy/Contract.js
console.warn('Warning: importing legacy Mongoose model Contract. Use Sequelize models instead.');
module.exports = require('./legacy/Contract.js');
