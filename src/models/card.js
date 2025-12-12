module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define(
    "Card",
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
      description: {
        type: DataTypes.TEXT,
      },
      position: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      listId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "cards",
      timestamps: true,
    }
  );

  Card.associate = (models) => {
    Card.belongsTo(models.List, { foreignKey: "listId", as: "list" });
  };

  return Card;
};
