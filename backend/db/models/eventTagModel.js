const { DataTypes, Model } = require("sequelize");

class EventTag extends Model {}

function initEventTagModel(sequelize) {
  EventTag.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      eventId: { type: DataTypes.INTEGER, allowNull: false },
      kind: { type: DataTypes.ENUM("tag", "subject"), allowNull: false },
      value: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "EventTag",
      indexes: [{ fields: ["event_id", "kind"] }, { fields: ["value"] }],
    }
  );

  return EventTag;
}

module.exports = { EventTag, initEventTagModel };
