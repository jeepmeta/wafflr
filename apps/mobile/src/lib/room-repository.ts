import type { DecisionTemplate, RoomMode, RoomSummary } from '@wafflr/shared-types';

export interface CreateRoomInput {
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  cardsPerGuest?: 1 | 2 | 3;
}

export interface RoomRepository {
  createRoom(input: CreateRoomInput): Promise<RoomSummary>;
  joinRoom(code: string): Promise<RoomSummary>;
  listRooms(): Promise<RoomSummary[]>;
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
  listCards(roomId: string): Promise<import('@wafflr/shared-types').DecisionCard[]>;
  addCard(roomId: string, input: CreateCardInput): Promise<import('@wafflr/shared-types').DecisionCard>;
  updateCard(roomId: string, cardId: string, input: CreateCardInput): Promise<void>;
  deleteCard(roomId: string, cardId: string): Promise<void>;
  startVoting(roomId: string): Promise<void>;
}
