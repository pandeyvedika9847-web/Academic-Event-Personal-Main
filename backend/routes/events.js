const express = require("express");
const { Op } = require("sequelize");
const { Event, EventTag, EventRegistration, User, sequelize } = require("../db/models");
const { protect, authorize } = require("../middleware/auth");
const { sendEventAlerts, sendRegistrationEmail } = require("../utils/emailService");
const { buildEventPayload } = require("../utils/eventPayload");
const { normalizeStringArray, replaceEventTags } = require("../utils/dbCollections");
const { parseId } = require("../utils/id");
const { serializeEvent, serializeUser } = require("../utils/serializers");

const router = express.Router();

const eventInclude = [
  { model: User, as: "createdBy", attributes: ["id", "fullName", "email", "role", "department"] },
  { model: EventTag, as: "tagItems" },
  { association: "registeredUsers", attributes: ["id"], through: { attributes: [] } },
];

async function notifySubscribedUsers(event) {
  const eventTags = [event.department, ...event.tags, ...event.subjectTags].filter(Boolean).map((value) => String(value).toLowerCase());
  if (eventTags.length === 0) return;

  const users = await User.findAll({ include: [{ association: "preferenceItems" }] });
  const matchingUsers = users.filter((user) => {
    const serialized = serializeUser(user);
    const preferences = [...serialized.interests, ...serialized.subscribedSubjects].map((value) => value.toLowerCase());
    return preferences.some((value) => eventTags.includes(value));
  });

  for (const user of matchingUsers) {
    const notifications = user.notifications || [];
    notifications.push({ type: "new_event", message: `New event matches your interests: ${event.title}`, read: false, date: new Date().toISOString(), relatedEvent: event._id });
    user.notifications = notifications;
    await user.save();
  }

  const emails = matchingUsers.map((user) => user.email).filter(Boolean);
  if (emails.length > 0) {
    await sendEventAlerts(emails, event);
  }
}

router.get("/", async (req, res) => {
  try {
    const { type, department, subject, search, featured, status, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const where = {};
    if (type && type !== "all") where.type = type;
    if (department && department !== "All Departments") where.department = department;
    if (featured === "true") where.featured = true;
    if (status !== "all") where.status = status || "approved";

    const events = await Event.findAll({ where, include: eventInclude, order: [["date", "ASC"]], limit: 500 });
    let filtered = events.map(serializeEvent);

    if (subject && subject !== "All Subjects") {
      filtered = filtered.filter((event) => event.subjectTags.includes(subject));
    }

    if (search) {
      const needle = String(search).trim().toLowerCase();
      filtered = filtered.filter((event) => [event.title, event.description, event.speaker, ...event.tags, ...event.subjectTags].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
    }

    const total = filtered.length;
    const paged = filtered.slice((safePage - 1) * safeLimit, safePage * safeLimit);
    res.status(200).json({ success: true, count: paged.length, total, page: safePage, pages: Math.ceil(total / safeLimit), events: paged });
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch events." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const eventId = parseId(req.params.id);
    if (!eventId) return res.status(400).json({ success: false, message: "Invalid event ID." });

    const event = await Event.findByPk(eventId, { include: eventInclude });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    res.status(200).json({ success: true, event: serializeEvent(event) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch event." });
  }
});

router.post("/", protect, authorize("faculty", "admin", "student"), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const payload = buildEventPayload(req.body);
    const { tags, subjectTags, ...eventFields } = payload;
    const event = await Event.create({ ...eventFields, createdById: req.user.id, status: req.user.role === "student" ? "pending" : "approved" }, { transaction });
    await replaceEventTags(event.id, { tags, subjectTags }, transaction);
    await transaction.commit();

    const fullEvent = await Event.findByPk(event.id, { include: eventInclude });
    const serialized = serializeEvent(fullEvent);
    if (serialized.status === "approved") {
      await notifySubscribedUsers(serialized);
      if (req.app.get("io")) req.app.get("io").emit("event_published", serialized);
    }

    res.status(201).json({ success: true, message: serialized.status === "approved" ? "Event created and published!" : "Event submitted for admin review.", event: serialized });
  } catch (error) {
    await transaction.rollback();
    console.error("Create Event Error:", error);
    res.status(500).json({ success: false, message: "Failed to create event." });
  }
});

router.put("/:id", protect, authorize("faculty", "admin", "student"), async (req, res) => {
  const eventId = parseId(req.params.id);
  if (!eventId) return res.status(400).json({ success: false, message: "Invalid event ID." });

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const isOwner = event.createdById === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Not authorized to update this event." });
    }

    const current = serializeEvent(await Event.findByPk(eventId, { include: eventInclude, transaction }));
    const updates = buildEventPayload(req.body, { isAdmin: req.user.role === "admin" });
    const { tags, subjectTags, ...eventFields } = updates;
    if (Object.keys(eventFields).length === 0 && req.body.tags === undefined && req.body.subjectTags === undefined) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "No valid fields to update." });
    }

    await event.update(eventFields, { transaction });
    if (req.body.tags !== undefined || req.body.subjectTags !== undefined) {
      await replaceEventTags(event.id, { tags, subjectTags }, transaction, current);
    }

    await transaction.commit();
    const updated = await Event.findByPk(eventId, { include: eventInclude });
    res.status(200).json({ success: true, message: "Event updated.", event: serializeEvent(updated) });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Failed to update event." });
  }
});

router.delete("/:id", protect, authorize("faculty", "admin", "student"), async (req, res) => {
  try {
    const eventId = parseId(req.params.id);
    if (!eventId) return res.status(400).json({ success: false, message: "Invalid event ID." });

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    if (event.createdById !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    await event.destroy();
    res.status(200).json({ success: true, message: "Event deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete event." });
  }
});

router.post("/:id/register", protect, async (req, res) => {
  const eventId = parseId(req.params.id);
  if (!eventId) return res.status(400).json({ success: false, message: "Invalid event ID." });

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    if (event.status !== "approved") {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Registration not available." });
    }

    if (event.registrations >= event.capacity) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Event is at full capacity." });
    }

    const [registration, created] = await EventRegistration.findOrCreate({ where: { userId: req.user.id, eventId }, defaults: { userId: req.user.id, eventId }, transaction });
    if (!created) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Already registered for this event." });
    }

    await event.update({ registrations: event.registrations + 1 }, { transaction });
    await transaction.commit();

    sendRegistrationEmail(req.user.email, req.user.fullName, { title: event.title, date: event.date, time: event.time, venue: event.venue });
    if (req.app.get("io")) req.app.get("io").emit("registration_update", { eventId });
    res.status(200).json({ success: true, message: "Successfully registered!" });
  } catch (error) {
    await transaction.rollback();
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Failed to register." });
  }
});

router.put("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const eventId = parseId(req.params.id);
    if (!eventId) return res.status(400).json({ success: false, message: "Invalid event ID." });
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
    }

    const event = await Event.findByPk(eventId, { include: eventInclude });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    await event.update({ status });
    const serialized = serializeEvent(event);
    serialized.status = status;

    if (status === "approved") {
      await notifySubscribedUsers(serialized);
      if (req.app.get("io")) req.app.get("io").emit("event_published", serialized);
    }

    res.status(200).json({ success: true, message: `Event ${status}.`, event: serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update event status." });
  }
});

router.put("/:id/featured", protect, authorize("admin"), async (req, res) => {
  try {
    const eventId = parseId(req.params.id);
    if (!eventId) return res.status(400).json({ success: false, message: "Invalid event ID." });

    const event = await Event.findByPk(eventId, { include: eventInclude });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    await event.update({ featured: !event.featured });
    const serialized = serializeEvent(event);
    serialized.featured = event.featured;
    res.status(200).json({ success: true, message: event.featured ? "Event featured!" : "Event unfeatured.", event: serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle featured." });
  }
});

module.exports = router;
