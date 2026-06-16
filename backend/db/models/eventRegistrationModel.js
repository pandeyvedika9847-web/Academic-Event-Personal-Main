const { DataTypes, Model } = require("sequelize");

class EventRegistration extends Model {}

function initEventRegistrationModel(sequelize) {
  EventRegistration.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      eventId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    },
    {
      sequelize,
      modelName: "EventRegistration",
      timestamps: false,
    }
  );

  return EventRegistration;
}

module.exports = { EventRegistration, initEventRegistrationModel };
