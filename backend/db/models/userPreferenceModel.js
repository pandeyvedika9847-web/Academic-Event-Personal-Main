const { DataTypes, Model } = require("sequelize");

class UserPreference extends Model {}

function initUserPreferenceModel(sequelize) {
  UserPreference.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      kind: { type: DataTypes.ENUM("interest", "subject"), allowNull: false },
      value: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "UserPreference",
      indexes: [{ fields: ["user_id", "kind"] }, { fields: ["value"] }],
    }
  );

  return UserPreference;
}

module.exports = { UserPreference, initUserPreferenceModel };
