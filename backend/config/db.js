const { sequelize, syncDatabase } = require("../db/models");

let connected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (connected) {
    return sequelize;
  }

  if (!connectionPromise) {
    connectionPromise = sequelize.authenticate();
  }

  await connectionPromise;
  connected = true;
  return sequelize;
};

const closeDB = async () => {
  connectionPromise = null;
  connected = false;
  await sequelize.close();
};

module.exports = { connectDB, closeDB, syncDatabase, sequelize };
