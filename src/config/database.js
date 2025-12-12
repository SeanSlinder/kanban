const { Sequelize } = require("sequelize");
require("dotenv").config();

const databaseUrl =
  process.env.DATABASE_URL || "postgres://localhost:5432/trello_dev";

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  define: {
    underscored: false,
  },
});

module.exports = { sequelize };
