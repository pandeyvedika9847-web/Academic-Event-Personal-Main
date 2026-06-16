const { DataTypes, Model } = require("sequelize");

const parseList = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

class Event extends Model {}

function initEventModel(sequelize) {
  Event.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      type: {
        type: DataTypes.ENUM("seminar", "workshop", "conference", "lecture", "training"),
        allowNull: false,
      },
      department: { type: DataTypes.STRING, allowNull: false },
      faculty: DataTypes.STRING,
      date: { type: DataTypes.DATE, allowNull: false },
      endDate: DataTypes.DATE,
      time: DataTypes.STRING,
      venue: { type: DataTypes.STRING, allowNull: false },
      speaker: DataTypes.STRING,
      capacity: { type: DataTypes.INTEGER, defaultValue: 200 },
      registrations: { type: DataTypes.INTEGER, defaultValue: 0 },
      views: { type: DataTypes.INTEGER, defaultValue: 0 },
      clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
      bannerImage: DataTypes.STRING,
      attachments: {
        type: DataTypes.TEXT("long"),
        get() {
          return parseList(this.getDataValue("attachments"));
        },
        set(value) {
          this.setDataValue("attachments", JSON.stringify(Array.isArray(value) ? value : []));
        },
      },
      color: { type: DataTypes.STRING, defaultValue: "#6366f1" },
      featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      rejectionReason: DataTypes.STRING,
      createdById: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Event",
      indexes: [
        { fields: ["status", "date"] },
        { fields: ["status", "type", "date"] },
        { fields: ["status", "department", "date"] },
        { fields: ["status", "featured", "date"] },
        { fields: ["created_by_id", "status"] },
      ],
    }
  );

  return Event;
}

module.exports = { Event, initEventModel };
