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
