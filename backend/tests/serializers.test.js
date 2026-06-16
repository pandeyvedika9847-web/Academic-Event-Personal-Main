const test = require("node:test");
const assert = require("node:assert/strict");

const { serializeEvent, serializeUser } = require("../utils/serializers");

test("serializeUser maps preferences and bookmarks into frontend shape", () => {
  const user = {
    id: 7,
    fullName: "Test User",
    email: "user@example.edu",
    role: "student",
    department: "Computer Science",
    preferenceItems: [
      { kind: "interest", value: "AI" },
      { kind: "subject", value: "Physics" },
    ],
    bookmarkedEvents: [{ id: 10 }, { id: 11 }],
    notifications: [],
  };

  const serialized = serializeUser(user);
  assert.deepEqual(serialized.interests, ["AI"]);
  assert.deepEqual(serialized.subscribedSubjects, ["Physics"]);
  assert.deepEqual(serialized.bookmarks, [10, 11]);
});

test("serializeEvent maps tag records and registered users", () => {
  const event = {
    id: 3,
    title: "Test Event",
    description: "Desc",
    type: "seminar",
    department: "Physics",
    date: new Date("2026-01-01T00:00:00Z"),
    venue: "Hall",
    capacity: 100,
    registrations: 1,
    tagItems: [
      { kind: "tag", value: "AI" },
      { kind: "subject", value: "Physics" },
    ],
    registeredUsers: [{ id: 9 }],
  };

  const serialized = serializeEvent(event);
  assert.deepEqual(serialized.tags, ["AI"]);
  assert.deepEqual(serialized.subjectTags, ["Physics"]);
  assert.deepEqual(serialized.registeredUsers, [9]);
});
