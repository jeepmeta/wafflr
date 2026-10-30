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
  const existing = await getSavedRooms();
  const next = [room, ...existing.filter(item => item.id !== room.id)].slice(0, 50);
  await SecureStore.setItemAsync(roomHistoryKey, JSON.stringify(next));
}

export async function getSavedRooms(): Promise<SavedRoom[]> {
  if (Platform.OS === 'web') return [];
  const raw = await SecureStore.getItemAsync(roomHistoryKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedRoom =>
      !!item && typeof item === 'object' &&
      typeof item.id === 'string' && typeof item.code === 'string' &&
      typeof item.title === 'string' &&
      (item.status === 'Created' || item.status === 'Joined')
    );
  } catch {
    return [];
  }
}
