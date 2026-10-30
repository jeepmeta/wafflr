import type { DecisionCard, DecisionTemplate, RoomMode, RoomSummary, VoteChoice } from '@wafflr/shared-types';

export interface CreateRoomInput {
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  cardsPerGuest?: 1 | 2 | 3;
}

export interface CreateCardInput {
  title: string;
  category?: string;
  location?: string;
}

export interface RoomRepository {
  createRoom(input: CreateRoomInput): Promise<RoomSummary>;
  joinRoom(code: string): Promise<RoomSummary>;
  listRooms(): Promise<RoomSummary[]>;
  listCards(roomId: string): Promise<DecisionCard[]>;
  addCard(roomId: string, input: CreateCardInput): Promise<DecisionCard>;
  updateCard(roomId: string, cardId: string, input: CreateCardInput): Promise<void>;
  deleteCard(roomId: string, cardId: string): Promise<void>;
  startVoting(roomId: string): Promise<void>;
  submitBallot(roomId: string, votes: { cardId: string; choice: VoteChoice }[]): Promise<import('./local-database').LocalRoundResult>;
  startTieBreak(roomId: string): Promise<DecisionCard[]>;
  chooseWinner(roomId: string, cardId: string): Promise<void>;
  getRoundResult(roomId: string): Promise<import('./local-database').LocalRoundResult | null>;
}
