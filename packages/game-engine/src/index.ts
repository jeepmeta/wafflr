import type {
  ApprovalScore,
  SubmittedBallot,
} from "@wafflr/shared-types";

/**
 * Counts Yep votes for each card.
 * Nah votes and missing votes do not subtract from the score.
 *
 * Each participant contributes at most one Yep vote per card.
 * The backend remains responsible for validating ballots and
 * authoritatively closing rounds.
 */
export function calculateApprovalScores(
  cardIds: readonly string[],
  ballots: readonly SubmittedBallot[],
): ApprovalScore[] {
  const counts = new Map(cardIds.map((id) => [id, 0]));

  for (const ballot of ballots) {
    const seen = new Set<string>();

    for (const vote of ballot.votes) {
      if (vote.choice !== "yep" || seen.has(vote.cardId)) {
        continue;
      }

      seen.add(vote.cardId);

      const current = counts.get(vote.cardId);
      if (current !== undefined) {
        counts.set(vote.cardId, current + 1);
      }
    }
  }

  return cardIds.map((cardId) => ({
    cardId,
    yepCount: counts.get(cardId) ?? 0,
  }));
}

/**
 * Returns all cards tied for the highest approval score.
 * Returns an empty array when there are no cards.
 */
export function findLeadingCardIds(
  scores: readonly ApprovalScore[],
): string[] {
  if (scores.length === 0) {
    return [];
  }

  const highest = Math.max(...scores.map((score) => score.yepCount));

  return scores
    .filter((score) => score.yepCount === highest)
    .map((score) => score.cardId);
}
