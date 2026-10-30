import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { DecisionTemplate, RoomMode, RoomPhase, RoomSummary } from '@wafflr/shared-types';

const DATABASE_NAME = 'wafflr-local.db';
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000;

type LocalRoomRow = {
  id: string;
  code: string;
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  phase: RoomPhase;
  guest_count: number;
  created_at: string;
  expires_at: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

function randomHex(byteCount: number) {
  return Array.from(Crypto.getRandomBytes(byteCount), byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateRoomCode() {
  let code = '';
  while (code.length < 6) {
    for (const byte of Crypto.getRandomBytes(8)) {
      if (byte < 224) code += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length];
      if (code.length === 6) break;
    }
  }
  return code;
}

function toRoomSummary(row: LocalRoomRow): RoomSummary {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    template: row.template,
    mode: row.mode,
    phase: row.phase,
    guestCount: row.guest_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

async function migrate(database: SQLite.SQLiteDatabase) {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) >= 1) return;

  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT NOT NULL UNIQUE COLLATE NOCASE,
        title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 80),
        template TEXT NOT NULL CHECK(template IN ('restaurant', 'movie', 'activity', 'custom')),
        mode TEXT NOT NULL CHECK(mode IN ('host', 'guests')),
        cards_per_guest INTEGER,
        phase TEXT NOT NULL DEFAULT 'collecting'
          CHECK(phase IN ('collecting', 'voting', 'round_reveal', 'completed', 'cancelled', 'expired')),
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        CHECK(
          (mode = 'guests' AND cards_per_guest BETWEEN 1 AND 3)
          OR (mode = 'host' AND cards_per_guest IS NULL)
        )
      );

      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY NOT NULL,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        credential_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('creator', 'guest')),
        joined_at TEXT NOT NULL,
        UNIQUE(room_id, credential_hash)
      );

      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY NOT NULL,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
        category TEXT,
        location TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ballots (
        id TEXT PRIMARY KEY NOT NULL,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL DEFAULT 1,
        submitted_at TEXT NOT NULL,
        UNIQUE(room_id, participant_id, round_number)
      );

      CREATE TABLE IF NOT EXISTS ballot_votes (
        ballot_id TEXT NOT NULL REFERENCES ballots(id) ON DELETE CASCADE,
        card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        choice TEXT NOT NULL CHECK(choice IN ('yep', 'nah')),
        PRIMARY KEY(ballot_id, card_id)
      );

      CREATE INDEX IF NOT EXISTS participants_room_id_idx ON participants(room_id);
      CREATE INDEX IF NOT EXISTS cards_room_id_idx ON cards(room_id);
      CREATE INDEX IF NOT EXISTS ballots_room_id_idx ON ballots(room_id);
      PRAGMA user_version = 1;
    `);
  });
}

export async function getLocalDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async database => {
      await migrate(database);
      return database;
    });
  }
  return databasePromise;
}

async function saveCredential(roomId: string, credential: string) {
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(`wafflr:participant:${roomId}`, credential);
}

async function removeCredential(roomId: string) {
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(`wafflr:participant:${roomId}`);
}

async function saveHistory(room: RoomSummary, status: 'Created' | 'Joined') {
  const { saveRoomHistory } = await import('./participant-credentials');
  await saveRoomHistory({ ...room, status });
}

function assertNativeLocalDatabase() {
  if (Platform.OS === 'web') {
    throw new Error('The local SQLite backend is currently enabled for iOS and Android. Web support will be added separately.');
  }
}

export async function createLocalRoom(input: {
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  cardsPerGuest?: 1 | 2 | 3;
}): Promise<{ room: RoomSummary }> {
  assertNativeLocalDatabase();
  const title = input.title.trim();
  if (title.length < 1 || title.length > 80) throw new Error('Room title must be between 1 and 80 characters.');
  if (input.mode === 'guests' && ![1, 2, 3].includes(input.cardsPerGuest ?? 0)) {
    throw new Error('Choose one, two, or three cards per guest.');
  }
  if (input.mode === 'host' && input.cardsPerGuest != null) {
    throw new Error('Host-created decks cannot have a guest card quota.');
  }

  const database = await getLocalDatabase();
  const roomId = Crypto.randomUUID();
  const credential = randomHex(32);
  const credentialHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, credential);
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ROOM_LIFETIME_MS).toISOString();
  let code = '';

  await database.withTransactionAsync(async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = generateRoomCode();
      const existing = await database.getFirstAsync<{ id: string }>(
        'SELECT id FROM rooms WHERE code = ? COLLATE NOCASE',
        candidate,
      );
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error('Could not create a unique room code. Please try again.');

    await database.runAsync(
      `INSERT INTO rooms (id, code, title, template, mode, cards_per_guest, phase, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'collecting', ?, ?)`,
      roomId, code, title, input.template, input.mode,
      input.mode === 'guests' ? input.cardsPerGuest ?? null : null,
      createdAt, expiresAt,
    );
    await database.runAsync(
      `INSERT INTO participants (id, room_id, credential_hash, role, joined_at)
       VALUES (?, ?, ?, 'creator', ?)`,
      Crypto.randomUUID(), roomId, credentialHash, createdAt,
    );
  });

  const room: RoomSummary = {
    id: roomId, code, title, template: input.template, mode: input.mode,
    phase: 'collecting', guestCount: 1, createdAt, expiresAt,
  };

  try {
    await saveCredential(roomId, credential);
  } catch {
    await database.runAsync('DELETE FROM rooms WHERE id = ?', roomId);
    throw new Error('The room was created locally, but this device could not securely save its access credential.');
  }
  try { await saveHistory(room, 'Created'); } catch { /* History is a convenience, not room authority. */ }
  return { room };
}

export async function joinLocalRoom(rawCode: string): Promise<{ room: RoomSummary }> {
  assertNativeLocalDatabase();
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('Enter a valid six-character room code.');

  const database = await getLocalDatabase();
  const room = await database.getFirstAsync<LocalRoomRow>(
    'SELECT * FROM rooms WHERE code = ? COLLATE NOCASE',
    code,
  );
  if (!room || room.phase !== 'collecting' || new Date(room.expires_at).getTime() <= Date.now()) {
    throw new Error('Room not found or no longer accepting guests on this device.');
  }

  const credential = randomHex(32);
  const credentialHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, credential);
  const participantId = Crypto.randomUUID();
  const joinedAt = new Date().toISOString();

  await database.withTransactionAsync(async () => {
    const current = await database.getFirstAsync<LocalRoomRow>(
      'SELECT * FROM rooms WHERE id = ? AND phase = \'collecting\' AND expires_at > ?',
      room.id, joinedAt,
    );
    if (!current) throw new Error('Room is no longer accepting guests.');
    await database.runAsync(
      `INSERT INTO participants (id, room_id, credential_hash, role, joined_at)
       VALUES (?, ?, ?, 'guest', ?)`,
      participantId, room.id, credentialHash, joinedAt,
    );
  });

  try {
    await saveCredential(room.id, credential);
  } catch {
    await database.runAsync('DELETE FROM participants WHERE id = ?', participantId);
    throw new Error('This device could not securely save its room access credential.');
  }

  const count = await database.getFirstAsync<{ guest_count: number }>(
    'SELECT COUNT(*) AS guest_count FROM participants WHERE room_id = ?',
    room.id,
  );
  const summary = toRoomSummary({ ...room, guest_count: count?.guest_count ?? room.guest_count + 1 });
  try { await saveHistory(summary, 'Joined'); } catch { /* Best-effort local history. */ }
  return { room: summary };
}

export async function listLocalRooms(): Promise<RoomSummary[]> {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const rows = await database.getAllAsync<LocalRoomRow>(
    `SELECT r.*, COUNT(p.id) AS guest_count
     FROM rooms r LEFT JOIN participants p ON p.room_id = r.id
     GROUP BY r.id ORDER BY r.created_at DESC`,
  );
  return rows.map(toRoomSummary);
}
