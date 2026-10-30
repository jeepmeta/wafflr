import type { DecisionTemplate, RoomSummary } from '@wafflr/shared-types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { saveParticipantCredential } from './participant-credentials';

type RoomMode = 'host' | 'guests';

type RoomApiResult = { room: RoomSummary };

type SupabaseRoomResponse = {
  room?: {
    id: string;
    code: string;
    title: string;
    template: DecisionTemplate;
    phase: RoomSummary['phase'];
    guestCount: number;
    createdAt: string;
    expiresAt?: string;
  };
  participantCredential?: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function requireConfiguration() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Wafflr rooms are not configured. Add the Supabase URL and anon key to the mobile environment.');
  }
}

async function persistParticipantCredential(roomId: string, credential: string) {
  if (Platform.OS === 'web') {
    throw new Error('Secure room access is currently supported in the iOS and Android apps.');
  }
  if (!/^[a-f0-9]{64}$/i.test(credential)) {
    throw new Error('The room service returned an invalid participant credential.');
  }
  await SecureStore.setItemAsync(`wafflr:participant:${roomId}`, credential);
}

export async function getParticipantCredential(roomId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(`wafflr:participant:${roomId}`);
}

async function callRoomRpc(
  functionName: 'wafflr_create_room' | 'wafflr_join_room',
  body: Record<string, unknown>,
): Promise<RoomApiResult> {
  requireConfiguration();

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${supabaseAnonKey!}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.text();
    if (response.status === 404) {
      throw new Error('The Wafflr room database is not installed yet.');
    }
    throw new Error(payload || `Room request failed (${response.status}).`);
  }

  const payload = (await response.json()) as SupabaseRoomResponse;
  if (!payload.room || !payload.participantCredential) {
    throw new Error('The room service returned an incomplete response.');
  }

  await saveParticipantCredential(payload.room.id, payload.participantCredential);

  await persistParticipantCredential(payload.room.id, payload.participantCredential);

  return {
    room: {
      ...payload.room,
      createdAt: payload.room.createdAt,
      expiresAt: payload.room.expiresAt,
    },
  };
}

export function createRoom(input: {
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  cardsPerGuest?: 1 | 2 | 3;
}): Promise<RoomApiResult> {
  return callRoomRpc('wafflr_create_room', {
    p_title: input.title.trim(),
    p_template: input.template,
    p_mode: input.mode,
    p_cards_per_guest: input.mode === 'guests' ? input.cardsPerGuest : null,
  });
}

export function joinRoom(code: string): Promise<RoomApiResult> {
  return callRoomRpc('wafflr_join_room', {
    p_code: code.trim().toUpperCase(),
  });
}
