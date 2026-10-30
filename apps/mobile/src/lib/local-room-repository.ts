import type { RoomRepository } from './room-repository';
import { createLocalRoom, joinLocalRoom, listLocalRooms } from './local-database';

export const localRoomRepository: RoomRepository = {
  async createRoom(input) {
    const result = await createLocalRoom(input);
    return result.room;
  },
  async joinRoom(code) {
    const result = await joinLocalRoom(code);
    return result.room;
  },
  listRooms: listLocalRooms,
};
