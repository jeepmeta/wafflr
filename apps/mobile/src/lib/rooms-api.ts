import type { DecisionTemplate, RoomMode } from '@wafflr/shared-types';
import { createLocalRoom, joinLocalRoom, listLocalRooms } from './local-database';

export type RoomApiResult = { room: import('@wafflr/shared-types').RoomSummary };

/**
 * The app uses a local SQLite backend during development.
 * Supabase remains a separate future adapter; no network request is made here.
 */
export function createRoom(input: {
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  cardsPerGuest?: 1 | 2 | 3;
}): Promise<RoomApiResult> {
  return createLocalRoom(input);
}

export function joinRoom(code: string): Promise<RoomApiResult> {
  return joinLocalRoom(code);
}

export { listLocalRooms };
