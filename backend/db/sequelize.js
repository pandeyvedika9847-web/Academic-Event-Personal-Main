const { Sequelize } = require("sequelize");
const { env } = require("../config/env");

const sequelize = new Sequelize({
  dialect: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
  },
});

module.exports = { sequelize };
