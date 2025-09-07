const { sequelize, connectSequelize } = require('../config/sequelize');

(async () => {
  await connectSequelize();
  await sequelize.sync({ alter: true });
  console.log('Database synchronized (sequelize.sync).');
  process.exit(0);
})();
