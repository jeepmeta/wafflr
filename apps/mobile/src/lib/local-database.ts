import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { DecisionCard, DecisionTemplate, RoomMode, RoomPhase, RoomSummary, RoundResult } from '@wafflr/shared-types';

const DATABASE_NAME = 'wafflr-local.db';
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000;
const SCHEMA_VERSION = 3;

type LocalRoomRow = {
  id: string;
  code: string;
  title: string;
  template: DecisionTemplate;
  mode: RoomMode;
  cards_per_guest: 1 | 2 | 3 | null;
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
    ...(row.cards_per_guest ? { cardsPerGuest: row.cards_per_guest } : {}),
    phase: row.phase,
    guestCount: row.guest_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

async function migrate(database: SQLite.SQLiteDatabase) {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = version?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) return;

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
    `);
    if (currentVersion < 1) await database.execAsync('PRAGMA user_version = 1;');
    if (currentVersion < 2) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS room_join_attempts (
          code TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
          window_started_at TEXT NOT NULL,
          attempt_count INTEGER NOT NULL CHECK(attempt_count >= 1)
        );
        CREATE INDEX IF NOT EXISTS room_join_attempts_window_idx
          ON room_join_attempts(window_started_at);
        PRAGMA user_version = 2;
      `);
    }
    if (currentVersion < 3) {
      await database.execAsync(`
        ALTER TABLE rooms ADD COLUMN current_round INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE rooms ADD COLUMN winner_card_id TEXT;
        CREATE TABLE IF NOT EXISTS round_cards (
          room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
          round_number INTEGER NOT NULL,
          card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
          PRIMARY KEY(room_id, round_number, card_id)
        );
        PRAGMA user_version = 3;
      `);
    }
  });
}

export async function getLocalDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async database => {
      await migrate(database);
      return database;
    }).catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

async function saveCredential(roomId: string, credential: string) {
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(`wafflr:participant:${roomId}`, credential);
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
    ...(input.mode === 'guests' ? { cardsPerGuest: input.cardsPerGuest } : {}),
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
  const nowIso = new Date().toISOString();
  const attempt = await database.getFirstAsync<{ window_started_at: string; attempt_count: number }>(
    'SELECT window_started_at, attempt_count FROM room_join_attempts WHERE code = ?',
    code,
  );
  const windowExpired = !attempt || Date.now() - new Date(attempt.window_started_at).getTime() > 5 * 60 * 1000;
  const attemptCount = windowExpired ? 1 : attempt.attempt_count + 1;
  await database.runAsync(
    `INSERT INTO room_join_attempts (code, window_started_at, attempt_count) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET window_started_at = excluded.window_started_at, attempt_count = excluded.attempt_count`,
    code, windowExpired ? nowIso : attempt.window_started_at, attemptCount,
  );
  if (attemptCount > 5) throw new Error('Too many attempts. Wait a few minutes and try again.');

  const SecureStore = await import('expo-secure-store');
  const existingCredential = await SecureStore.getItemAsync(`wafflr:participant:${(await database.getFirstAsync<{ id: string }>('SELECT id FROM rooms WHERE code = ? COLLATE NOCASE', code))?.id ?? ''}`);
  if (existingCredential) throw new Error('This device is already participating in that room.');

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


type LocalCardRow = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  participant_id?: string;
};

const simulatorActiveKey = (roomId: string) => `wafflr:simulator-active:${roomId}`;
const simulatorCredentialKey = (roomId: string, participantId: string) => `wafflr:simulator-participant:${roomId}:${participantId}`;

async function getStoredParticipantCredential(roomId: string) {
  const SecureStore = await import('expo-secure-store');
  const activeSimulatorId = await SecureStore.getItemAsync(simulatorActiveKey(roomId));
  if (activeSimulatorId) {
    const simulated = await SecureStore.getItemAsync(simulatorCredentialKey(roomId, activeSimulatorId));
    if (simulated) return simulated;
  }
  return SecureStore.getItemAsync(`wafflr:participant:${roomId}`);
}

export async function getActiveLocalParticipantRole(roomId: string): Promise<'creator' | 'guest'> {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  return (await requireLocalParticipant(database, roomId)).role;
}

/** Development-only identity switching. No names or profiles are created. */
export async function createLocalSimulatorGuest(roomId: string): Promise<void> {
  if (!__DEV__) throw new Error('The participant simulator is only available in development builds.');
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const credential = randomHex(32);
  const credentialHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, credential);
  const participantId = Crypto.randomUUID();
  const joinedAt = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    const room = await database.getFirstAsync<{ phase: RoomPhase; expires_at: string }>(
      'SELECT phase, expires_at FROM rooms WHERE id = ?', roomId,
    );
    if (!room || room.phase === 'completed' || room.phase === 'cancelled' || room.phase === 'expired' ||
      new Date(room.expires_at).getTime() <= Date.now()) {
      throw new Error('This room is no longer available for simulator participants.');
    }
    await database.runAsync(
      'INSERT INTO participants (id, room_id, credential_hash, role, joined_at) VALUES (?, ?, ?, \'guest\', ?)',
      participantId, roomId, credentialHash, joinedAt,
    );
  });
  const SecureStore = await import('expo-secure-store');
  try {
    await SecureStore.setItemAsync(simulatorCredentialKey(roomId, participantId), credential);
    await SecureStore.setItemAsync(simulatorActiveKey(roomId), participantId);
  } catch {
    await database.runAsync('DELETE FROM participants WHERE id = ?', participantId);
    throw new Error('Could not securely store the simulator participant.');
  }
}

export async function switchLocalSimulatorToCreator(roomId: string): Promise<void> {
  if (!__DEV__) throw new Error('The participant simulator is only available in development builds.');
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(simulatorActiveKey(roomId));
}

async function requireLocalParticipant(database: SQLite.SQLiteDatabase, roomId: string) {
  const SecureStore = await import('expo-secure-store');
  const credential = await getStoredParticipantCredential(roomId);
  if (!credential) throw new Error('This device does not have access to this room.');
  const credentialHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, credential);
  const participant = await database.getFirstAsync<{ id: string; role: 'creator' | 'guest' }>(
    'SELECT id, role FROM participants WHERE room_id = ? AND credential_hash = ?',
    roomId, credentialHash,
  );
  if (!participant) throw new Error('Room access could not be verified on this device.');
  return participant;
}

export async function listLocalCards(roomId: string): Promise<DecisionCard[]> {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  const rows = await database.getAllAsync<LocalCardRow>(
    'SELECT id, title, category, location, participant_id FROM cards WHERE room_id = ? ORDER BY created_at ASC',
    roomId,
  );
  return rows.map(row => ({
    id: row.id, title: row.title,
    ...(row.category ? { category: row.category } : {}),
    ...(row.location ? { location: row.location } : {}),
    canEdit: participant.role === 'creator' || row.participant_id === participant.id,
    isMine: row.participant_id === participant.id,
  }));
}

export async function addLocalCard(roomId: string, input: {
  title: string; category?: string; location?: string;
}): Promise<DecisionCard> {
  assertNativeLocalDatabase();
  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) throw new Error('Choice names must be between 1 and 120 characters.');
  const category = input.category?.trim() || null;
  const location = input.location?.trim() || null;
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  await database.withTransactionAsync(async () => {
    const room = await database.getFirstAsync<{
      mode: RoomMode; phase: RoomPhase; cards_per_guest: number | null;
    }>('SELECT mode, phase, cards_per_guest FROM rooms WHERE id = ?', roomId);
    if (!room || room.phase !== 'collecting') throw new Error('This room is no longer collecting choices.');
    const totals = await database.getFirstAsync<{ total: number; mine: number }>(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN participant_id = ? THEN 1 ELSE 0 END) AS mine FROM cards WHERE room_id = ?',
      participant.id, roomId,
    );
    if ((totals?.total ?? 0) >= 100) throw new Error('This room has reached its 100-choice limit.');
    if (room.mode === 'host' && participant.role !== 'creator') {
      throw new Error('Only the room creator can add choices in this deck mode.');
    }
    if (room.mode === 'guests' && (totals?.mine ?? 0) >= (room.cards_per_guest ?? 0)) {
      throw new Error('You have used your choice limit for this room.');
    }
    await database.runAsync(
      'INSERT INTO cards (id, room_id, participant_id, title, category, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, roomId, participant.id, title, category, location, now, now,
    );
  });

  return { id, title, ...(category ? { category } : {}), ...(location ? { location } : {}), canEdit: true, isMine: true };
}

export async function updateLocalCard(roomId: string, cardId: string, input: {
  title: string; category?: string; location?: string;
}) {
  assertNativeLocalDatabase();
  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) throw new Error('Choice names must be between 1 and 120 characters.');
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  const card = await database.getFirstAsync<{ participant_id: string }>(
    'SELECT participant_id FROM cards WHERE id = ? AND room_id = ?', cardId, roomId,
  );
  if (!card) throw new Error('Choice not found in this room.');
  const room = await database.getFirstAsync<{ phase: RoomPhase }>('SELECT phase FROM rooms WHERE id = ?', roomId);
  if (room?.phase !== 'collecting') throw new Error('Choices are locked once voting starts.');
  if (participant.role !== 'creator' && card.participant_id !== participant.id) {
    throw new Error('You can only edit choices you added.');
  }
  await database.runAsync(
    'UPDATE cards SET title = ?, category = ?, location = ?, updated_at = ? WHERE id = ? AND room_id = ?',
    title, input.category?.trim() || null, input.location?.trim() || null,
    new Date().toISOString(), cardId, roomId,
  );
}

export async function deleteLocalCard(roomId: string, cardId: string) {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  const card = await database.getFirstAsync<{ participant_id: string }>(
    'SELECT participant_id FROM cards WHERE id = ? AND room_id = ?', cardId, roomId,
  );
  if (!card) throw new Error('Choice not found in this room.');
  const room = await database.getFirstAsync<{ phase: RoomPhase }>('SELECT phase FROM rooms WHERE id = ?', roomId);
  if (room?.phase !== 'collecting') throw new Error('Choices are locked once voting starts.');
  if (participant.role !== 'creator' && card.participant_id !== participant.id) {
    throw new Error('You can only remove choices you added.');
  }
  await database.runAsync('DELETE FROM cards WHERE id = ? AND room_id = ?', cardId, roomId);
}

export async function startLocalVoting(roomId: string) {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  if (participant.role !== 'creator') throw new Error('Only the room creator can start voting.');
  await database.withTransactionAsync(async () => {
    const room = await database.getFirstAsync<{ phase: RoomPhase }>('SELECT phase FROM rooms WHERE id = ?', roomId);
    if (room?.phase !== 'collecting') throw new Error('This room is not collecting choices.');
    const count = await database.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM cards WHERE room_id = ?', roomId,
    );
    if ((count?.total ?? 0) < 2) throw new Error('Add at least two choices before voting.');
    await database.runAsync('INSERT INTO round_cards (room_id, round_number, card_id) SELECT ?, 1, id FROM cards WHERE room_id = ?', roomId, roomId);
    await database.runAsync('UPDATE rooms SET phase = \'voting\', current_round = 1 WHERE id = ?', roomId);
  });
}


export async function submitLocalBallot(roomId: string, votes: { cardId: string; choice: 'yep' | 'nah' }[]): Promise<RoundResult> {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  let output!: RoundResult;
  await database.withTransactionAsync(async () => {
    const room = await database.getFirstAsync<{ phase: RoomPhase; current_round: number }>(
      'SELECT phase, current_round FROM rooms WHERE id = ?', roomId,
    );
    if (room?.phase !== 'voting') throw new Error('This room is not accepting votes.');
    const cards = await database.getAllAsync<{ card_id: string }>(
      'SELECT card_id FROM round_cards WHERE room_id = ? AND round_number = ? ORDER BY card_id',
      roomId, room.current_round,
    );
    if (cards.length < 2) throw new Error('There are not enough choices in this round.');
    if (votes.length !== cards.length || new Set(votes.map(vote => vote.cardId)).size !== cards.length) {
      throw new Error('Vote Yep or Nah on every card before submitting.');
    }
    const allowed = new Set(cards.map(card => card.card_id));
    if (votes.some(vote => !allowed.has(vote.cardId) || !['yep', 'nah'].includes(vote.choice))) {
      throw new Error('Your ballot contains an invalid choice.');
    }
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM ballots WHERE room_id = ? AND participant_id = ? AND round_number = ?',
      roomId, participant.id, room.current_round,
    );
    if (existing) throw new Error('Your ballot has already been submitted.');
    const ballotId = Crypto.randomUUID();
    await database.runAsync(
      'INSERT INTO ballots (id, room_id, participant_id, round_number, submitted_at) VALUES (?, ?, ?, ?, ?)',
      ballotId, roomId, participant.id, room.current_round, new Date().toISOString(),
    );
    for (const vote of votes) {
      await database.runAsync(
        'INSERT INTO ballot_votes (ballot_id, card_id, choice) VALUES (?, ?, ?)',
        ballotId, vote.cardId, vote.choice,
      );
    }
    const participation = await database.getFirstAsync<{ total: number; submitted: number }>(
      `SELECT COUNT(*) AS total,
        (SELECT COUNT(*) FROM ballots WHERE room_id = ? AND round_number = ?) AS submitted
       FROM participants WHERE room_id = ?`,
      roomId, room.current_round, roomId,
    );
    if ((participation?.submitted ?? 0) < (participation?.total ?? 0)) {
      output = { phase: 'voting', round: room.current_round, hasSubmitted: true };
      return;
    }

    const scores = await database.getAllAsync<{ card_id: string; yep_count: number }>(
      `SELECT rc.card_id,
        SUM(CASE WHEN b.id IS NOT NULL AND bv.choice = 'yep' THEN 1 ELSE 0 END) AS yep_count
       FROM round_cards rc
       LEFT JOIN ballot_votes bv ON bv.card_id = rc.card_id
       LEFT JOIN ballots b ON b.id = bv.ballot_id
         AND b.room_id = rc.room_id AND b.round_number = rc.round_number
       WHERE rc.room_id = ? AND rc.round_number = ?
       GROUP BY rc.card_id ORDER BY yep_count DESC`,
      roomId, room.current_round,
    );
    const highest = Math.max(...scores.map(score => score.yep_count));
    const leaders = scores.filter(score => score.yep_count === highest);
    const scoreOutput = scores.map(score => ({ cardId: score.card_id, yepCount: score.yep_count }));
    if (leaders.length === 1) {
      await database.runAsync(
        'UPDATE rooms SET phase = \'completed\', winner_card_id = ? WHERE id = ?',
        leaders[0].card_id, roomId,
      );
      const winner = await database.getFirstAsync<LocalCardRow>(
        'SELECT id, title, category, location FROM cards WHERE id = ?', leaders[0].card_id,
      );
      output = {
        phase: 'completed', round: room.current_round, scores: scoreOutput,
        winner: winner ? { id: winner.id, title: winner.title, ...(winner.category ? { category: winner.category } : {}), ...(winner.location ? { location: winner.location } : {}) } : undefined,
      };
      return;
    }
    await database.runAsync(
      'UPDATE rooms SET phase = \'round_reveal\', current_round = current_round + 1 WHERE id = ?',
      roomId,
    );
    output = {
      phase: 'round_reveal', round: room.current_round + 1, scores: scoreOutput,
      tiedCards: await Promise.all(leaders.map(async leader => {
        const row = await database.getFirstAsync<LocalCardRow>(
          'SELECT id, title, category, location FROM cards WHERE id = ?', leader.card_id,
        );
        return row ? { id: row.id, title: row.title, ...(row.category ? { category: row.category } : {}), ...(row.location ? { location: row.location } : {}) } : null;
      })).then(items => items.filter((item): item is DecisionCard => item !== null)),
    };
  });
  return output;
}

export async function startLocalTieBreak(roomId: string): Promise<DecisionCard[]> {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  if (participant.role !== 'creator') throw new Error('Only the room creator can start the tie-breaker.');
  let output!: DecisionCard[];
  await database.withTransactionAsync(async () => {
    const room = await database.getFirstAsync<{ phase: RoomPhase; current_round: number }>(
      'SELECT phase, current_round FROM rooms WHERE id = ?', roomId,
    );
    if (room?.phase !== 'round_reveal') throw new Error('This room is not ready for a tie-breaker.');
    const previousRound = room.current_round - 1;
    const scoreRows = await database.getAllAsync<{ card_id: string; yep_count: number }>(
      `SELECT rc.card_id,
        SUM(CASE WHEN b.id IS NOT NULL AND bv.choice = 'yep' THEN 1 ELSE 0 END) AS yep_count
       FROM round_cards rc
       LEFT JOIN ballots b ON b.room_id = rc.room_id AND b.round_number = rc.round_number
       LEFT JOIN ballot_votes bv ON bv.ballot_id = b.id AND bv.card_id = rc.card_id
       WHERE rc.room_id = ? AND rc.round_number = ?
       GROUP BY rc.card_id`,
      roomId, previousRound,
    );
    const highest = Math.max(...scoreRows.map(row => row.yep_count));
    const tied = scoreRows.filter(row => row.yep_count === highest).map(row => ({ card_id: row.card_id }));
    if (tied.length < 2) throw new Error('There is no tie to break.');
    for (const card of tied) {
      await database.runAsync(
        'INSERT INTO round_cards (room_id, round_number, card_id) VALUES (?, ?, ?)',
        roomId, room.current_round, card.card_id,
      );
    }
    await database.runAsync('UPDATE rooms SET phase = \'voting\' WHERE id = ?', roomId);
    output = await Promise.all(tied.map(async item => {
      const row = await database.getFirstAsync<LocalCardRow>(
        'SELECT id, title, category, location FROM cards WHERE id = ?', item.card_id,
      );
      return row ? { id: row.id, title: row.title, ...(row.category ? { category: row.category } : {}), ...(row.location ? { location: row.location } : {}) } : null;
    })).then(items => items.filter((item): item is DecisionCard => item !== null));
  });
  return output;
}

export async function chooseLocalWinner(roomId: string, cardId: string) {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  const participant = await requireLocalParticipant(database, roomId);
  if (participant.role !== 'creator') throw new Error('Only the room creator can choose the winner.');
  await database.withTransactionAsync(async () => {
    const room = await database.getFirstAsync<{ phase: RoomPhase; current_round: number }>(
      'SELECT phase, current_round FROM rooms WHERE id = ?', roomId,
    );
    if (room?.phase !== 'round_reveal' || room.current_round < 3) {
      throw new Error('The creator can choose a winner only after a repeated tie.');
    }
    const valid = await database.getFirstAsync<{ card_id: string }>(
      'SELECT card_id FROM round_cards WHERE room_id = ? AND round_number = ? AND card_id = ?',
      roomId, room.current_round - 1, cardId,
    );
    if (!valid) throw new Error('Choose one of the tied cards.');
    await database.runAsync(
      'UPDATE rooms SET phase = \'completed\', winner_card_id = ? WHERE id = ?',
      cardId, roomId,
    );
  });
}

export async function getRoundResult(roomId: string): Promise<RoundResult | null> {
  assertNativeLocalDatabase();
  const database = await getLocalDatabase();
  await requireLocalParticipant(database, roomId);
  const room = await database.getFirstAsync<{ phase: RoomPhase; current_round: number; winner_card_id: string | null }>(
    'SELECT phase, current_round, winner_card_id FROM rooms WHERE id = ?', roomId,
  );
  if (!room) return null;
  if (room.phase === 'completed' && room.winner_card_id) {
    const row = await database.getFirstAsync<LocalCardRow>(
      'SELECT id, title, category, location FROM cards WHERE id = ?', room.winner_card_id,
    );
    if (row) return { phase: 'completed', round: room.current_round, winner: { id: row.id, title: row.title, ...(row.category ? { category: row.category } : {}), ...(row.location ? { location: row.location } : {}) } };
  }
  if (room.phase === 'voting') {
    const participant = await requireLocalParticipant(database, roomId);
    const ballot = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM ballots WHERE room_id = ? AND participant_id = ? AND round_number = ?',
      roomId, participant.id, room.current_round,
    );
    if (room.current_round === 1) return { phase: 'voting', round: room.current_round, hasSubmitted: !!ballot };
  }
  if (room.phase === 'voting' && room.current_round > 1) {
    const participant = await requireLocalParticipant(database, roomId);
    const ballot = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM ballots WHERE room_id = ? AND participant_id = ? AND round_number = ?',
      roomId, participant.id, room.current_round,
    );
    const tiedRows = await database.getAllAsync<{ card_id: string }>(
      'SELECT card_id FROM round_cards WHERE room_id = ? AND round_number = ? ORDER BY card_id',
      roomId, room.current_round,
    );
    const tiedCards = await Promise.all(tiedRows.map(async item => {
      const row = await database.getFirstAsync<LocalCardRow>(
        'SELECT id, title, category, location FROM cards WHERE id = ?', item.card_id,
      );
      return row ? { id: row.id, title: row.title, ...(row.category ? { category: row.category } : {}), ...(row.location ? { location: row.location } : {}) } : null;
    }));
    return {
      phase: 'voting', round: room.current_round, hasSubmitted: !!ballot,
      tiedCards: tiedCards.filter((item): item is DecisionCard => item !== null),
    };
  }
  if (room.phase === 'round_reveal') {
    const previousRound = room.current_round - 1;
    const scores = await database.getAllAsync<{ card_id: string; yep_count: number }>(
      `SELECT rc.card_id,
        SUM(CASE WHEN b.id IS NOT NULL AND bv.choice = 'yep' THEN 1 ELSE 0 END) AS yep_count
       FROM round_cards rc
       LEFT JOIN ballots b ON b.room_id = rc.room_id AND b.round_number = rc.round_number
       LEFT JOIN ballot_votes bv ON bv.ballot_id = b.id AND bv.card_id = rc.card_id
       WHERE rc.room_id = ? AND rc.round_number = ?
       GROUP BY rc.card_id ORDER BY yep_count DESC`,
      roomId, previousRound,
    );
    const highest = Math.max(...scores.map(score => score.yep_count));
    const leaders = scores.filter(score => score.yep_count === highest);
    const tiedCards = await Promise.all(leaders.map(async leader => {
      const row = await database.getFirstAsync<LocalCardRow>(
        'SELECT id, title, category, location FROM cards WHERE id = ?', leader.card_id,
      );
      return row ? { id: row.id, title: row.title, ...(row.category ? { category: row.category } : {}), ...(row.location ? { location: row.location } : {}) } : null;
    }));
    return {
      phase: 'round_reveal', round: room.current_round,
      scores: scores.map(score => ({ cardId: score.card_id, yepCount: score.yep_count })),
      tiedCards: tiedCards.filter((item): item is DecisionCard => item !== null),
    };
  }
  return { phase: room.phase, round: room.current_round };
}
