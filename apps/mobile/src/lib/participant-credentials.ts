import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const credentialKey = (roomId: string) => `wafflr:participant:${roomId}`;

export async function saveParticipantCredential(roomId: string, credential: string) {
  if (Platform.OS === 'web') throw new Error('Secure room access is currently supported in the iOS and Android apps.');
  if (!roomId || !/^[a-f0-9]{64}$/i.test(credential)) throw new Error('Cannot save an invalid room credential.');
  await SecureStore.setItemAsync(credentialKey(roomId), credential);
}

export async function getParticipantCredential(roomId: string) {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(credentialKey(roomId));
}

export async function deleteParticipantCredential(roomId: string) {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(credentialKey(roomId));
}

export type SavedRoom = import('@wafflr/shared-types').RoomSummary & {
  status: 'Created' | 'Joined';
};

const roomHistoryKey = 'wafflr:room-history';

export async function saveRoomHistory(room: SavedRoom) {
  if (Platform.OS === 'web') return;
  const existing = await getRoomHistoryIds();
  const next = [room.id, ...existing.filter(id => id !== room.id)].slice(0, 8);
  await SecureStore.setItemAsync(`wafflr:room:${room.id}`, JSON.stringify(room));
  await SecureStore.setItemAsync(roomHistoryKey, JSON.stringify(next));
  const removed = existing.filter(id => !next.includes(id));
  await Promise.all(removed.map(id => SecureStore.deleteItemAsync(`wafflr:room:${id}`)));
}

async function getRoomHistoryIds(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(roomHistoryKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

export async function getSavedRooms(): Promise<SavedRoom[]> {
  if (Platform.OS === 'web') return [];
  const ids = await getRoomHistoryIds();
  const records = await Promise.all(ids.map(async id => {
    const raw = await SecureStore.getItemAsync(`wafflr:room:${id}`);
    if (!raw) return null;
    try {
      const item: unknown = JSON.parse(raw);
      if (!item || typeof item !== 'object') return null;
      const room = item as Partial<SavedRoom>;
      if (
        room.id !== id ||
        typeof room.code !== 'string' ||
        typeof room.title !== 'string' ||
        (room.status !== 'Created' && room.status !== 'Joined')
      ) return null;
      return room as SavedRoom;
    } catch {
      return null;
    }
  }));
  return records.filter((room): room is SavedRoom => room !== null);
}

export async function removeRoomHistory(roomIds: string[]) {
  if (Platform.OS === 'web' || roomIds.length === 0) return;
  const ids = await getRoomHistoryIds();
  const removed = new Set(roomIds);
  await Promise.all(roomIds.map(id => SecureStore.deleteItemAsync(`wafflr:room:${id}`)));
  await SecureStore.setItemAsync(roomHistoryKey, JSON.stringify(ids.filter(id => !removed.has(id))));
}
