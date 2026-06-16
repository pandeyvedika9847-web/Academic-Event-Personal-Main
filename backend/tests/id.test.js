const test = require("node:test");
const assert = require("node:assert/strict");

const { parseId } = require("../utils/id");

test("parseId returns positive integers only", () => {
  assert.equal(parseId("12"), 12);
  assert.equal(parseId(5), 5);
  assert.equal(parseId("0"), null);
  assert.equal(parseId("abc"), null);
});
