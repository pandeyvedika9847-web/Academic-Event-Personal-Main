const { DataTypes, Model } = require("sequelize");

class Bookmark extends Model {}

function initBookmarkModel(sequelize) {
  Bookmark.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      eventId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    },
    {
      sequelize,
      modelName: "Bookmark",
      timestamps: false,
    }
  );

  return Bookmark;
}

module.exports = { Bookmark, initBookmarkModel };
