import * as SecureStore from 'expo-secure-store';

const credentialKey = (roomId: string) => `wafflr:participant:${roomId}`;

export async function saveParticipantCredential(roomId: string, credential: string) {
  if (!roomId || !credential) throw new Error('Cannot save an incomplete room credential.');
  await SecureStore.setItemAsync(credentialKey(roomId), credential);
}

export async function getParticipantCredential(roomId: string) {
  return SecureStore.getItemAsync(credentialKey(roomId));
}

export async function deleteParticipantCredential(roomId: string) {
  await SecureStore.deleteItemAsync(credentialKey(roomId));
}
