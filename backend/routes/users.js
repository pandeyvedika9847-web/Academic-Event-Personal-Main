const express = require("express");
const { Op } = require("sequelize");
const { sequelize, User, Event, EventTag, Bookmark } = require("../db/models");
const { protect, authorize, invalidateUserCache } = require("../middleware/auth");
const { parseId } = require("../utils/id");
const { replaceUserPreferences } = require("../utils/dbCollections");
const { serializeEvent, serializeUser } = require("../utils/serializers");

const router = express.Router();

const eventInclude = [
  { model: User, as: "createdBy", attributes: ["id", "fullName", "email", "role", "department"] },
  { model: EventTag, as: "tagItems" },
  { association: "registeredUsers", attributes: ["id"], through: { attributes: [] } },
];

router.post("/bookmarks/:id", protect, async (req, res) => {
  const eventId = parseId(req.params.id);
  if (!eventId) {
    return res.status(400).json({ success: false, message: "Invalid event ID." });
  }

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const existing = await Bookmark.findOne({ where: { userId: req.user.id, eventId }, transaction });
    if (existing) {
      await existing.destroy({ transaction });
    } else {
      await Bookmark.create({ userId: req.user.id, eventId }, { transaction });
    }

    await transaction.commit();
    invalidateUserCache(String(req.user.id));

    const bookmarks = await Bookmark.findAll({ where: { userId: req.user.id }, attributes: ["eventId"] });
    res.status(200).json({ success: true, message: existing ? "Bookmark removed." : "Event bookmarked.", bookmarks: bookmarks.map((item) => item.eventId) });
  } catch (error) {
    await transaction.rollback();
    console.error("Bookmark Error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle bookmark." });
  }
});

router.patch("/preferences", protect, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const currentUser = await User.findByPk(req.user.id, { include: [{ association: "preferenceItems" }], transaction });
    const current = serializeUser(currentUser);
    const payload = {
      interests: req.body.interests !== undefined ? req.body.interests : current.interests,
      subscribedSubjects: req.body.subscribedSubjects !== undefined ? req.body.subscribedSubjects : current.subscribedSubjects,
    };

    await replaceUserPreferences(req.user.id, payload, transaction);
    await transaction.commit();
    invalidateUserCache(String(req.user.id));

    res.status(200).json({ success: true, message: "Preferences updated.", interests: payload.interests, subscribedSubjects: payload.subscribedSubjects });
  } catch (error) {
    await transaction.rollback();
    console.error("Preferences Update Error:", error);
    res.status(500).json({ success: false, message: "Failed to update preferences." });
  }
});

router.get("/dashboard", protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: "preferenceItems" },
        { association: "bookmarkedEvents", include: eventInclude, through: { attributes: [] } },
        { association: "registeredEvents", include: eventInclude, through: { attributes: [] } },
      ],
    });

    const serializedUser = serializeUser(user);
    const now = new Date();
    let recommendedEvents = [];

    const interests = [...serializedUser.interests, ...serializedUser.subscribedSubjects].map((value) => value.toLowerCase());
    const candidates = await Event.findAll({ where: { status: "approved", date: { [Op.gte]: now } }, include: eventInclude, order: [["date", "ASC"]], limit: 30 });

    if (interests.length > 0) {
      recommendedEvents = candidates.filter((event) => {
        const serializedEvent = serializeEvent(event);
        const values = [serializedEvent.department, ...serializedEvent.tags, ...serializedEvent.subjectTags].map((value) => String(value).toLowerCase());
        return interests.some((interest) => values.includes(interest));
      });
    }

    if (recommendedEvents.length === 0) {
      recommendedEvents = candidates.slice(0, 6);
    }

    res.status(200).json({
      success: true,
      registeredEvents: user.registeredEvents.map(serializeEvent),
      bookmarkedEvents: user.bookmarkedEvents.map(serializeEvent),
      recommendedEvents: recommendedEvents.slice(0, 6).map(serializeEvent),
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data." });
  }
});

router.get("/my-events", protect, async (req, res) => {
  try {
    const events = await Event.findAll({ where: { createdById: req.user.id }, include: eventInclude, order: [["date", "ASC"]] });
    res.status(200).json({ success: true, events: events.map(serializeEvent) });
  } catch (error) {
    console.error("My Events Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your events." });
  }
});

router.get("/", protect, authorize("admin"), async (_req, res) => {
  try {
    const users = await User.findAll({ attributes: ["id", "fullName", "email", "role", "department"] });
    res.status(200).json({ success: true, users: users.map(serializeUser) });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

module.exports = router;
