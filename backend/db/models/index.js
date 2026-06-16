const { sequelize } = require("../sequelize");
const { User, initUserModel } = require("./userModel");
const { Event, initEventModel } = require("./eventModel");
const { EventTag, initEventTagModel } = require("./eventTagModel");
const { UserPreference, initUserPreferenceModel } = require("./userPreferenceModel");
const { Bookmark, initBookmarkModel } = require("./bookmarkModel");
const { EventRegistration, initEventRegistrationModel } = require("./eventRegistrationModel");

initUserModel(sequelize);
initEventModel(sequelize);
initEventTagModel(sequelize);
initUserPreferenceModel(sequelize);
initBookmarkModel(sequelize);
initEventRegistrationModel(sequelize);

User.hasMany(Event, { as: "createdEvents", foreignKey: "createdById", onDelete: "CASCADE" });
Event.belongsTo(User, { as: "createdBy", foreignKey: "createdById" });

Event.hasMany(EventTag, { as: "tagItems", foreignKey: "eventId", onDelete: "CASCADE" });
EventTag.belongsTo(Event, { foreignKey: "eventId" });

User.hasMany(UserPreference, { as: "preferenceItems", foreignKey: "userId", onDelete: "CASCADE" });
UserPreference.belongsTo(User, { foreignKey: "userId" });

User.belongsToMany(Event, { through: Bookmark, as: "bookmarkedEvents", foreignKey: "userId", otherKey: "eventId" });
Event.belongsToMany(User, { through: Bookmark, as: "bookmarkedByUsers", foreignKey: "eventId", otherKey: "userId" });

User.belongsToMany(Event, { through: EventRegistration, as: "registeredEvents", foreignKey: "userId", otherKey: "eventId" });
Event.belongsToMany(User, { through: EventRegistration, as: "registeredUsers", foreignKey: "eventId", otherKey: "userId" });

async function syncDatabase(options = {}) {
  await sequelize.sync(options);
}

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Event,
  EventTag,
  UserPreference,
  Bookmark,
  EventRegistration,
};
