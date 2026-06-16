const { EventTag, UserPreference } = require("../db/models");

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

async function replaceEventTags(eventId, payload, transaction, current = {}) {
  await EventTag.destroy({ where: { eventId }, transaction });

  const rows = [
    ...normalizeStringArray(payload.tags !== undefined ? payload.tags : current.tags).map((value) => ({ eventId, kind: "tag", value })),
    ...normalizeStringArray(payload.subjectTags !== undefined ? payload.subjectTags : current.subjectTags).map((value) => ({ eventId, kind: "subject", value })),
  ];

  if (rows.length > 0) {
    await EventTag.bulkCreate(rows, { transaction });
  }
}

async function replaceUserPreferences(userId, payload, transaction, current = {}) {
  await UserPreference.destroy({ where: { userId }, transaction });

  const rows = [
    ...normalizeStringArray(payload.interests !== undefined ? payload.interests : current.interests).map((value) => ({ userId, kind: "interest", value })),
    ...normalizeStringArray(payload.subscribedSubjects !== undefined ? payload.subscribedSubjects : current.subscribedSubjects).map((value) => ({ userId, kind: "subject", value })),
  ];

  if (rows.length > 0) {
    await UserPreference.bulkCreate(rows, { transaction });
  }
}

module.exports = {
  normalizeStringArray,
  replaceEventTags,
  replaceUserPreferences,
};
