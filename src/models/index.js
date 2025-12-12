const Sequelize = require("sequelize");
const { sequelize } = require("../config/database");
const UserModel = require("./user");
const BoardModel = require("./board");
const ListModel = require("./list");
const CardModel = require("./card");

const models = {};

models.User = UserModel(sequelize, Sequelize.DataTypes);
models.Board = BoardModel(sequelize, Sequelize.DataTypes);
models.List = ListModel(sequelize, Sequelize.DataTypes);
models.Card = CardModel(sequelize, Sequelize.DataTypes);

Object.keys(models).forEach((name) => {
  if (typeof models[name].associate === "function") {
    models[name].associate(models);
  }
});

module.exports = { sequelize, Sequelize, models };
