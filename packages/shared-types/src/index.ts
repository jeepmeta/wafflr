export type DecisionTemplate =
  | "restaurant"
  | "movie"
  | "activity"
  | "custom";

export type RoomPhase =
  | "collecting"
  | "voting"
  | "round_reveal"
  | "completed"
  | "cancelled"
  | "expired";

export type VoteChoice = "yep" | "nah";

export interface DecisionCard {
  id: string;
  title: string;
  category?: string;
  location?: string;
  canEdit?: boolean;
}

export type RoomMode = "host" | "guests";

export interface RoomSummary {
  id: string;
  code: string;
  title: string;
  template: DecisionTemplate;
  mode?: RoomMode;
  phase: RoomPhase;
  guestCount: number;
  createdAt: string;
  expiresAt?: string;
}

export interface CardVote {
  cardId: string;
  choice: VoteChoice;
}

export interface SubmittedBallot {
  participantId: string;
  votes: CardVote[];
  submittedAt: string;
}

export interface ApprovalScore {
  cardId: string;
  yepCount: number;
}

export interface RoundResult {
  phase: RoomPhase;
  round: number;
  winner?: DecisionCard;
  tiedCards?: DecisionCard[];
  scores?: ApprovalScore[];
}
