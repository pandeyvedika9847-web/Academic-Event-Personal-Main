const express = require("express");
const { Event, User } = require("../db/models");
const { protect, authorize } = require("../middleware/auth");
const { serializeEvent } = require("../utils/serializers");

const router = express.Router();

router.get("/faculty", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { createdById: req.user.id },
      include: [{ model: User, as: "createdBy", attributes: ["id", "fullName", "email", "role", "department"] }],
      order: [["date", "DESC"]],
    });

    res.status(200).json({ success: true, events: events.map(serializeEvent) });
  } catch (error) {
    console.error("Faculty Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics." });
  }
});

module.exports = router;
