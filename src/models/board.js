module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define(
    "Board",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "boards",
      timestamps: true,
    }
  );

  Board.associate = (models) => {
    Board.belongsTo(models.User, { foreignKey: "userId", as: "owner" });
    Board.hasMany(models.List, { foreignKey: "boardId", as: "lists" });
  };

  return Board;
};
