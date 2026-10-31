import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateApprovalScores,
  findLeadingCardIds,
} from "../src/index.ts";

test("returns zero scores for an empty ballot set", () => {
  assert.deepEqual(calculateApprovalScores(["a", "b"], []), [
    { cardId: "a", yepCount: 0 },
    { cardId: "b", yepCount: 0 },
  ]);
});

test("Nah votes do not subtract and missing votes count as zero", () => {
  const scores = calculateApprovalScores(["a", "b", "c"], [
    { participantId: "one", submittedAt: "2026-01-01T00:00:00.000Z", votes: [{ cardId: "a", choice: "yep" }, { cardId: "b", choice: "nah" }] },
    { participantId: "two", submittedAt: "2026-01-01T00:00:00.000Z", votes: [{ cardId: "a", choice: "nah" }, { cardId: "b", choice: "yep" }] },
  ]);
  assert.deepEqual(scores, [
    { cardId: "a", yepCount: 1 },
    { cardId: "b", yepCount: 1 },
    { cardId: "c", yepCount: 0 },
  ]);
});

test("counts at most one Yep per card in each ballot", () => {
  const scores = calculateApprovalScores(["a"], [
    { participantId: "one", submittedAt: "2026-01-01T00:00:00.000Z", votes: [
      { cardId: "a", choice: "yep" },
      { cardId: "a", choice: "yep" },
    ] },
  ]);
  assert.deepEqual(scores, [{ cardId: "a", yepCount: 1 }]);
});

test("ignores votes for card IDs outside the deck", () => {
  const scores = calculateApprovalScores(["a"], [
    { participantId: "one", submittedAt: "2026-01-01T00:00:00.000Z", votes: [{ cardId: "not-in-deck", choice: "yep" }] },
  ]);
  assert.deepEqual(scores, [{ cardId: "a", yepCount: 0 }]);
});

test("returns every highest-scoring card and handles empty scores", () => {
  assert.deepEqual(findLeadingCardIds([
    { cardId: "a", yepCount: 2 },
    { cardId: "b", yepCount: 2 },
    { cardId: "c", yepCount: 1 },
  ]), ["a", "b"]);
  assert.deepEqual(findLeadingCardIds([]), []);
});

test("preserves the input deck order in scores and ties", () => {
  const scores = calculateApprovalScores(["b", "a"], []);
  assert.deepEqual(scores.map((score) => score.cardId), ["b", "a"]);
  assert.deepEqual(findLeadingCardIds(scores), ["b", "a"]);
});
