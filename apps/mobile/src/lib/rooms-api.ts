import type { DecisionTemplate, RoomSummary } from '@wafflr/shared-types';
import { Platform } from 'react-native';
import { saveParticipantCredential, saveRoomHistory } from './participant-credentials';

import type { RoomMode } from '@wafflr/shared-types';

type RoomApiResult = { room: RoomSummary };

type SupabaseRoomResponse = {
  room?: {
    id: string;
    code: string;
    title: string;
    template: DecisionTemplate;
    mode: RoomMode;
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

async function callRoomRpc(
  functionName: 'wafflr_create_room' | 'wafflr_join_room',
  body: Record<string, unknown>,
  status: 'Created' | 'Joined',
): Promise<RoomApiResult> {
  requireConfiguration();
  if (Platform.OS === 'web') {
    throw new Error('Live room creation and joining are currently available in the iOS and Android apps.');
  }

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
  await saveRoomHistory({ ...payload.room, status });

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
  }, 'Created');
}

export function joinRoom(code: string): Promise<RoomApiResult> {
  return callRoomRpc('wafflr_join_room', {
    p_code: code.trim().toUpperCase(),
  }, 'Joined');
}
