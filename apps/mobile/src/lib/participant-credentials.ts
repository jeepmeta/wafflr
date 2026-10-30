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
