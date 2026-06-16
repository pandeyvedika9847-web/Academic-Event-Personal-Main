const EDITABLE_EVENT_FIELDS = [
  "title",
  "description",
  "type",
  "department",
  "faculty",
  "date",
  "endDate",
  "time",
  "venue",
  "speaker",
  "capacity",
  "tags",
  "subjectTags",
  "bannerImage",
  "attachments",
  "color",
];

const ADMIN_ONLY_EVENT_FIELDS = ["featured", "status", "rejectionReason"];

const STRING_FIELDS = new Set([
  "title",
  "description",
  "type",
  "department",
  "faculty",
  "time",
  "venue",
  "speaker",
  "bannerImage",
  "color",
  "status",
  "rejectionReason",
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
}

function sanitizeAttachments(value) {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => ({
      title: typeof item?.title === "string" ? item.title.trim() : "",
      url: typeof item?.url === "string" ? item.url.trim() : "",
    }))
    .filter((item) => item.title && item.url);
}

function buildEventPayload(input, { isAdmin = false } = {}) {
  const allowedFields = isAdmin
    ? [...EDITABLE_EVENT_FIELDS, ...ADMIN_ONLY_EVENT_FIELDS]
    : EDITABLE_EVENT_FIELDS;

  return allowedFields.reduce((payload, field) => {
    if (input[field] === undefined) {
      return payload;
    }

    if (field === "tags" || field === "subjectTags") {
      payload[field] = sanitizeStringArray(input[field]);
      return payload;
    }

    if (field === "attachments") {
      payload[field] = sanitizeAttachments(input[field]);
      return payload;
    }

    if (field === "capacity") {
      payload.capacity = Number(input.capacity);
      return payload;
    }

    if (STRING_FIELDS.has(field)) {
      payload[field] =
        typeof input[field] === "string" ? input[field].trim() : input[field];
      return payload;
    }

    payload[field] = input[field];
    return payload;
  }, {});
}

module.exports = {
  EDITABLE_EVENT_FIELDS,
  ADMIN_ONLY_EVENT_FIELDS,
  buildEventPayload,
  escapeRegExp,
};
