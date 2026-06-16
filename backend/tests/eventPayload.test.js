const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildEventPayload,
  escapeRegExp,
} = require("../utils/eventPayload");

test("buildEventPayload keeps only allowed public fields", () => {
  const payload = buildEventPayload({
    title: "  Event Title  ",
    description: " Demo ",
    tags: "ai, ml , ",
    registrations: 999,
    registeredUsers: ["user-1"],
    status: "approved",
  });

  assert.deepEqual(payload, {
    title: "Event Title",
    description: "Demo",
    tags: ["ai", "ml"],
  });
});

test("buildEventPayload allows admin-only fields for admins", () => {
  const payload = buildEventPayload(
    {
      title: "Event",
      status: "approved",
      featured: true,
      rejectionReason: "",
    },
    { isAdmin: true }
  );

  assert.equal(payload.status, "approved");
  assert.equal(payload.featured, true);
  assert.equal(payload.rejectionReason, "");
});

test("escapeRegExp escapes special regex characters", () => {
  assert.equal(escapeRegExp("ai+(ml)?"), "ai\\+\\(ml\\)\\?");
});
