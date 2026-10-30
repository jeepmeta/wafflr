import type { RoomRepository } from './room-repository';
import { addLocalCard, chooseLocalWinner, createLocalRoom, deleteLocalCard, getRoundResult, joinLocalRoom, listLocalCards, listLocalRooms, startLocalTieBreak, startLocalVoting, submitLocalBallot, updateLocalCard } from './local-database';

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
  listCards: listLocalCards,
  addCard: addLocalCard,
  updateCard: updateLocalCard,
  deleteCard: deleteLocalCard,
  startVoting: startLocalVoting,
  submitBallot: submitLocalBallot,
  startTieBreak: startLocalTieBreak,
  chooseWinner: chooseLocalWinner,
  getRoundResult: getLocalRoundResult,
};
