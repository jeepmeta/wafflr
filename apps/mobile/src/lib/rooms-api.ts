import type { RoomSummary } from '@wafflr/shared-types';
import { localRoomRepository } from './local-room-repository';
import type { CreateRoomInput, RoomRepository } from './room-repository';

let activeRepository: RoomRepository = localRoomRepository;

/**
 * The UI depends on this repository contract, not on SQLite or Supabase.
 * Local SQLite is the default until a remote adapter is implemented and tested.
 */
export function configureRoomRepository(repository: RoomRepository) {
  activeRepository = repository;
}

export function createRoom(input: CreateRoomInput): Promise<{ room: RoomSummary }> {
  return activeRepository.createRoom(input).then(room => ({ room }));
}

export function joinRoom(code: string): Promise<{ room: RoomSummary }> {
  return activeRepository.joinRoom(code).then(room => ({ room }));
}

export function listRooms(): Promise<RoomSummary[]> {
  return activeRepository.listRooms();
}

export function listCards(roomId: string) {
  return activeRepository.listCards(roomId);
}

export function addCard(roomId: string, input: import('./room-repository').CreateCardInput) {
  return activeRepository.addCard(roomId, input);
}

export function updateCard(roomId: string, cardId: string, input: import('./room-repository').CreateCardInput) {
  return activeRepository.updateCard(roomId, cardId, input);
}

export function deleteCard(roomId: string, cardId: string) {
  return activeRepository.deleteCard(roomId, cardId);
}

export function startVoting(roomId: string) {
  return activeRepository.startVoting(roomId);
}
