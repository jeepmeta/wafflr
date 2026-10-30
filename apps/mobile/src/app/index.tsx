import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@wafflr/design-tokens';
import type { DecisionTemplate, RoomSummary } from '@wafflr/shared-types';
import { createRoom, joinRoom } from '../lib/rooms-api';
import { getSavedRooms, type SavedRoom } from '../lib/participant-credentials';

type Room = SavedRoom;
type SetupMode = 'create' | 'join' | null;
type Template = 'Where to Eat' | 'What to Watch' | 'What to Do' | 'Custom';


function Button({ label, onPress, accent = false, compact = false }: { label: string; onPress: () => void; accent?: boolean; compact?: boolean }) {
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[motion, compact && { width: '100%' }]}><Pressable accessibilityRole="button" onPress={onPress} onPressIn={() => { scale.value = withSpring(.96); }} onPressOut={() => { scale.value = withSpring(1); }} style={[s.button, { backgroundColor: accent ? colors.accent : colors.butter }, compact && s.compactButton]}><Text style={[s.buttonText, accent && { color: colors.white }]}>{label}</Text></Pressable></Animated.View>;
}

function Rooms({ close, rooms }: { close: () => void; rooms: Room[] }) {
  const [share, setShare] = useState<Room | null>(null);
  return <Animated.View entering={FadeIn.duration(150)} style={s.backdrop}>
    <Pressable accessibilityLabel="Close rooms" onPress={close} style={StyleSheet.absoluteFill} />
    <Animated.View entering={FadeInDown.springify()} style={s.modal}>
      <View style={s.modalHead}><Text style={s.modalTitle}>Your Rooms</Text><Pressable onPress={close} style={s.close}><Text style={s.closeText}>×</Text></Pressable></View>
      <View style={s.counts}><View style={s.count}><Text style={s.countNum}>{rooms.filter(room => room.status === 'Created').length}</Text><Text style={s.countLabel}>Created</Text></View><View style={s.count}><Text style={s.countNum}>{rooms.filter(room => room.status === 'Joined').length}</Text><Text style={s.countLabel}>Joined</Text></View></View>
      <ScrollView contentContainerStyle={{ gap: 9 }}>
        {rooms.length === 0 ? <Text style={s.formHint}>Rooms you create or join on this device will show up here.</Text> : rooms.map(room => <View key={room.id} style={s.room}>
          <Pressable onPress={() => setShare(room)} style={s.roomMain}><View style={s.roomIcon}><Text style={s.roomInitial}>{room.title[0]}</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={s.roomTitle}>{room.title}</Text><Text style={s.roomMeta}>{room.status} · {room.phase}</Text></View></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Share ' + room.title} onPress={() => setShare(room)} style={s.qr}><Text style={{ fontSize: 23, color: colors.ink }}>▦</Text></Pressable>
        </View>)}
      </ScrollView>
      {share && <View style={s.share}><Text style={s.roomTitle}>Share {share.title}</Text><Text style={s.code}>{share.code}</Text><Text style={s.roomMeta}>Room code · Share this with your group</Text><Button label="Done" compact onPress={() => setShare(null)} /></View>}
    </Animated.View>
  </Animated.View>;
}

function SetupFlow({
  mode, close, template, setTemplate, roomTitle, setRoomTitle, joinCode, setJoinCode, deckMode, setDeckMode, onComplete,
}: {
  mode: Exclude<SetupMode, null>; close: () => void; template: Template; setTemplate: (v: Template) => void;
  roomTitle: string; setRoomTitle: (v: string) => void; joinCode: string; setJoinCode: (v: string) => void;
  deckMode: 'host' | 'guests'; setDeckMode: (v: 'host' | 'guests') => void; onComplete: (room: RoomSummary) => void;
}) {
  const [step, setStep] = useState<'template' | 'details' | 'mode'>('template');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cardsPerGuest, setCardsPerGuest] = useState<1 | 2 | 3>(1);
  const [createdRoom, setCreatedRoom] = useState<RoomSummary | null>(null);
  const templates: Template[] = ['Where to Eat', 'What to Watch', 'What to Do', 'Custom'];
  const joinValid = joinCode.trim().length === 6;
  const createTitleValid = roomTitle.trim().length > 0;
  const heading = createdRoom ? (mode === 'create' ? 'Room created!' : 'You’re in!') : mode === 'join' ? 'Join a Room' : step === 'template' ? 'What are we deciding?' : step === 'details' ? 'Name your room' : 'Who adds the choices?';

  const next = async () => {
    if (mode === 'join') {
      if (!joinValid) { setError('Enter the 6-character room code.'); return; }
      setBusy(true);
      try {
        const result = await joinRoom(joinCode);
        setCreatedRoom(result.room);
        onComplete(result.room);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not join this room.');
      } finally { setBusy(false); }
      return;
    }
    if (step === 'template') { setStep('details'); setError(''); return; }
    if (step === 'details') {
      if (!createTitleValid) { setError('Give your room a name first.'); return; }
      setStep('mode'); setError(''); return;
    }
    setBusy(true);
    try {
      const result = await createRoom({
        title: roomTitle,
        template: ({ 'Where to Eat': 'restaurant', 'What to Watch': 'movie', 'What to Do': 'activity', Custom: 'custom' } as const)[template] as DecisionTemplate,
        mode: deckMode,
        cardsPerGuest: deckMode === 'guests' ? cardsPerGuest : undefined,
      });
      setCreatedRoom(result.room);
      onComplete(result.room);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create this room.');
    } finally { setBusy(false); }
  };

  return <Animated.View entering={FadeIn.duration(150)} style={s.backdrop}>
    <Pressable accessibilityLabel="Close setup" onPress={close} style={StyleSheet.absoluteFill} />
    <Animated.View entering={FadeInDown.springify()} style={s.modal}>
      <View style={s.modalHead}><Text style={s.modalTitle}>{heading}</Text><Pressable onPress={close} style={s.close}><Text style={s.closeText}>×</Text></Pressable></View>
      {createdRoom ? <View style={{ alignItems: 'center', gap: 9, paddingVertical: 12 }}>
        <Text style={s.formHint}>{createdRoom.title}</Text>
        <Text style={s.code}>{createdRoom.code}</Text>
        <Text style={s.roomMeta}>Share this six-character code with your group.</Text>
        <Button label="Done" compact onPress={close} />
      </View> : mode === 'join' ? <>
        <Text style={s.formHint}>Enter the room code your host shared with you.</Text>
        <TextInput value={joinCode} onChangeText={v => { setJoinCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setError(''); }} autoCapitalize="characters" autoCorrect={false} maxLength={6} placeholder="ABC123" placeholderTextColor="#B7AEB4" style={s.codeInput} accessibilityLabel="Six-character room code" />
      </> : step === 'template' ? <View style={s.templateGrid}>
        {templates.map((item, i) => <Pressable key={item} onPress={() => setTemplate(item)} style={[s.templateChoice, template === item && s.templateSelected]}><Text style={s.templateEmoji}>{['🍽️', '🎬', '🎯', '✨'][i]}</Text><Text style={s.templateText}>{item}</Text></Pressable>)}
      </View> : step === 'details' ? <>
        <Text style={s.formHint}>Make it easy for everyone to recognize.</Text>
        <TextInput value={roomTitle} onChangeText={v => { setRoomTitle(v); setError(''); }} placeholder={template === 'Where to Eat' ? 'e.g. Friday Night Food' : template === 'What to Watch' ? 'e.g. Movie Night' : 'e.g. Weekend Plans'} placeholderTextColor="#B7AEB4" maxLength={48} style={s.titleInput} accessibilityLabel="Room title" />
      </> : <View style={{ gap: 10 }}>
        <Text style={s.formHint}>Choose how the deck gets made.</Text>
        <Pressable onPress={() => setDeckMode('host')} style={[s.modeChoice, deckMode === 'host' && s.templateSelected]}><Text style={s.modeTitle}>I'll add all the choices</Text><Text style={s.modeHint}>Build the deck yourself.</Text></Pressable>
        <Pressable onPress={() => setDeckMode('guests')} style={[s.modeChoice, deckMode === 'guests' && s.templateSelected]}><Text style={s.modeTitle}>Everyone contributes</Text><Text style={s.modeHint}>Each person adds choices before voting.</Text></Pressable>
        {deckMode === 'guests' && <View style={s.guestQuota}><Text style={s.modeTitle}>Choices per guest</Text><View style={{ flexDirection: 'row', gap: 8 }}>{([1, 2, 3] as const).map(n => <Pressable key={n} onPress={() => setCardsPerGuest(n)} style={[s.quotaChoice, cardsPerGuest === n && s.templateSelected]}><Text style={s.modeTitle}>{n}</Text></Pressable>)}</View></View>}
      </View>}
      {!!error && <Text style={s.errorText}>{error}</Text>}
      {!createdRoom && <View style={s.flowButtons}>
        <Pressable onPress={() => { if (mode === 'create' && step !== 'template') setStep(step === 'mode' ? 'details' : 'template'); else close(); setError(''); }} style={s.backLink}><Text style={s.backLinkText}>{mode === 'create' && step !== 'template' ? 'Back' : 'Cancel'}</Text></Pressable>
        <View style={{ flex: 1 }}><Button label={busy ? (mode === 'join' ? 'Joining…' : 'Creating…') : mode === 'join' || step === 'mode' ? 'Continue' : 'Next'} onPress={() => { if (!busy && !createdRoom) void next(); }} compact /></View>
      </View>}
      {mode === 'create' && step === 'mode' && !createdRoom && <Text style={s.demoNote}>Your group can join with the room code after the room is created.</Text>}
    </Animated.View>
  </Animated.View>;
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<'home' | 'winner'>('home');
  const [rooms, setRooms] = useState(false);
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [template, setTemplate] = useState<Template>('Where to Eat');
  const [roomTitle, setRoomTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [deckMode, setDeckMode] = useState<'host' | 'guests'>('host');
  const [backVisible, setBackVisible] = useState(false);
  const [recentRoom, setRecentRoom] = useState<RoomSummary | null>(null);
  const [savedRooms, setSavedRooms] = useState<Room[]>([]);
  const { width } = useWindowDimensions();
  useEffect(() => { void getSavedRooms().then(setSavedRooms).catch(() => undefined); }, []);
  useEffect(() => {
    if (screen !== 'winner') { setBackVisible(false); return; }
    const timer = setTimeout(() => setBackVisible(true), 2200);
    return () => clearTimeout(timer);
  }, [screen]);
  const handleRoomSuccess = (room: RoomSummary) => { const saved = { ...room, status: setupMode === 'join' ? 'Joined' as const : 'Created' as const }; setRecentRoom(room); setSavedRooms(current => [saved, ...current.filter(item => item.id !== room.id)].slice(0, 8)); };
  const beginCreate = () => { setTemplate('Where to Eat'); setRoomTitle(''); setSetupMode('create'); };
  const beginJoin = () => { setJoinCode(''); setSetupMode('join'); };
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}><View style={s.shell}>
    <View style={s.header}>
      <View style={s.brand}><View style={s.miniWaffle}><Text style={{ color: colors.syrup, fontSize: 16 }}>▦</Text></View><Text style={s.brandText}>WAFFLR</Text></View>
      <Pressable accessibilityRole="button" onPress={() => setRooms(true)} style={s.roomsButton}><Text style={s.roomsLabel}>Your Rooms</Text><View style={s.badge}><Text style={s.badgeText}>{savedRooms.length}</Text></View></Pressable>
    </View>
    {screen === 'home' ? <Animated.View entering={FadeIn.duration(220)} style={s.home}>
      <View style={s.hero}>
        <Animated.View entering={FadeInDown.delay(80).springify()} style={s.butters}><View style={s.waffleGrid}>{Array.from({ length: 16 }, (_, i) => <View key={i} style={s.waffleCell} />)}</View><View style={s.face}><View style={s.eyes}><View style={s.eye} /><View style={s.eye} /></View><View style={s.smile} /></View><Text style={s.sparkle}>✦</Text></Animated.View>
        <Animated.Text entering={FadeInDown.delay(150).springify()} style={[s.wordmark, width < 390 && { fontSize: 40 }]}>WAFFLR</Animated.Text><Text style={s.tagline}>Stop waffling. Start deciding.</Text>
      </View>
      <View style={s.actions}><View style={{ flex: 1 }}><Button label="Create Room" onPress={beginCreate} /></View><View style={{ flex: 1 }}><Button label="Join Room" accent onPress={beginJoin} /></View></View>
      {recentRoom && <View style={s.recentRoom}><Text style={s.modeTitle}>{recentRoom.title}</Text><Text style={s.code}>{recentRoom.code}</Text><Text style={s.modeHint}>Room code · Share this with your group</Text></View>}<Text style={s.footer}>A little help for the big “what should we do?”</Text>
    </Animated.View> : <View style={s.winner}>
      <Animated.View entering={FadeInDown.delay(80).springify()} style={{ alignItems: 'center', marginBottom: 16 }}><Text style={s.eyebrow}>THE GROUP HAS SPOKEN</Text><Text style={s.winnerHeading}>And the winner is…</Text></Animated.View>
      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.winnerCard}><View style={s.foodArt}><View style={s.plate}><Text style={{ fontSize: 59 }}>🍕</Text></View></View><Text style={s.winnerLabel}>TONIGHT'S PICK</Text><Text style={s.winnerName}>Bob's Pizza Joint</Text><Text style={s.category}>Pizza · Italian</Text></Animated.View>
      <View style={s.stars}>{[0, 1, 2].map(i => <Animated.Text key={i} entering={FadeInDown.delay(400 + i * 230).springify().damping(8)} style={[s.star, i === 1 && s.bigStar]}>★</Animated.Text>)}</View>
      {backVisible ? <Animated.View entering={FadeIn.duration(160)} style={{ width: '100%', maxWidth: 340, marginTop: 8 }}><Button label="Back to Home" compact onPress={() => setScreen('home')} /></Animated.View> : <Text style={s.waiting}>Picking a winner…</Text>}
    </View>}
    <Text style={s.copyright}>© WAFFLR</Text>
  </View>{rooms && <Rooms close={() => setRooms(false)} rooms={savedRooms} />}{setupMode && <SetupFlow mode={setupMode} close={() => setSetupMode(null)} template={template} setTemplate={setTemplate} roomTitle={roomTitle} setRoomTitle={setRoomTitle} joinCode={joinCode} setJoinCode={setJoinCode} deckMode={deckMode} setDeckMode={setDeckMode} onComplete={handleRoomSuccess} />}</SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  shell: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: spacing.lg, backgroundColor: colors.white },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 2, borderBottomColor: colors.cream },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniWaffle: { width: 28, height: 28, borderRadius: 7, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-7deg' }] },
  brandText: { color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  roomsButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 13, paddingRight: 6, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.cream },
  roomsLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  badge: { minWidth: 25, height: 25, borderRadius: 14, backgroundColor: colors.butter, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  home: { flex: 1, justifyContent: 'center', paddingBottom: 20 },
  hero: { alignItems: 'center', marginTop: -24, marginBottom: 30 },
  butters: { width: 124, height: 124, borderRadius: 27, borderWidth: 4, borderColor: colors.ink, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }], marginBottom: 13 },
  waffleGrid: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 5 },
  waffleCell: { width: 17, height: 17, borderRadius: 4, backgroundColor: '#F4BD37', borderWidth: 1.5, borderColor: '#D99A25' },
  face: { alignItems: 'center', marginTop: 14 },
  eyes: { flexDirection: 'row', gap: 19, marginBottom: 7 },
  eye: { width: 8, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  smile: { width: 18, height: 9, borderBottomWidth: 3, borderColor: colors.ink, borderRadius: 12 },
  sparkle: { position: 'absolute', right: -17, top: -8, color: colors.accent, fontSize: 30, fontWeight: '900' },
  wordmark: { color: colors.ink, fontSize: 48, fontWeight: '900', letterSpacing: 3 },
  tagline: { marginTop: 2, color: colors.syrup, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  button: { minHeight: 106, borderRadius: 22, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', padding: spacing.md, shadowColor: colors.ink, shadowOffset: { width: 0, height: 5 }, shadowOpacity: .16, shadowRadius: 0, elevation: 4 },
  compactButton: { minHeight: 48, borderRadius: radii.lg, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  footer: { color: '#746B70', textAlign: 'center', fontSize: 12, fontWeight: '600' },
  copyright: { textAlign: 'center', color: '#A9A3A6', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, paddingTop: 5, paddingBottom: 8 },
  winner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 15 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  winnerHeading: { color: colors.ink, fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  winnerCard: { width: '100%', maxWidth: 340, alignItems: 'center', backgroundColor: colors.cream, borderColor: colors.ink, borderWidth: 3, borderRadius: 28, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  foodArt: { width: '100%', height: 150, backgroundColor: '#FFE8A3', borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F3D37A' },
  plate: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.white, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  winnerLabel: { marginTop: spacing.lg, color: colors.syrup, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  winnerName: { marginTop: 4, color: colors.ink, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  category: { marginTop: 5, color: '#746B70', fontSize: 14, fontWeight: '700' },
  stars: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md, height: 52 },
  star: { color: colors.butter, fontSize: 39, fontWeight: '900', textShadowColor: colors.syrup, textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 1 },
  bigStar: { fontSize: 49, marginTop: -7 },
  waiting: { color: '#9A9096', fontSize: 12, fontWeight: '700', marginTop: 8 },
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10, backgroundColor: 'rgba(45,38,51,0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  modal: { width: '100%', maxWidth: 460, maxHeight: '82%', backgroundColor: colors.white, borderRadius: 28, borderWidth: 3, borderColor: colors.ink, padding: spacing.lg },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.ink, fontSize: 29, lineHeight: 31, fontWeight: '800' },
  counts: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  count: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radii.lg, backgroundColor: colors.cream, paddingVertical: spacing.md },
  countNum: { fontSize: 22, color: colors.ink, fontWeight: '900' },
  countLabel: { fontSize: 13, color: colors.syrup, fontWeight: '800' },
  room: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radii.lg, borderWidth: 2, borderColor: '#E9DDBE', backgroundColor: '#FFFCF4', padding: 8 },
  roomMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  roomIcon: { width: 45, height: 45, borderRadius: 13, backgroundColor: colors.butter, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  roomInitial: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  roomTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  roomMeta: { color: '#82777E', fontSize: 11, fontWeight: '700', marginTop: 4 },
  qr: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  share: { marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.cream, alignItems: 'center', gap: 6 },
  formHint: { color: '#746B70', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  templateChoice: { width: '48%', flexGrow: 1, minHeight: 102, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 17, borderWidth: 2, borderColor: '#E9DDBE', backgroundColor: '#FFFCF4' },
  templateSelected: { borderColor: colors.ink, backgroundColor: '#FFF0B8' },
  templateEmoji: { fontSize: 28 },
  templateText: { color: colors.ink, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  titleInput: { minHeight: 54, borderWidth: 2, borderColor: colors.ink, borderRadius: 15, paddingHorizontal: 14, color: colors.ink, fontSize: 16, fontWeight: '700', backgroundColor: colors.white },
  codeInput: { minHeight: 64, borderWidth: 2, borderColor: colors.ink, borderRadius: 15, paddingHorizontal: 12, color: colors.ink, fontSize: 27, fontWeight: '900', letterSpacing: 5, textAlign: 'center', backgroundColor: colors.white },
  modeChoice: { padding: 14, borderRadius: 16, borderWidth: 2, borderColor: '#E9DDBE', backgroundColor: '#FFFCF4' },
  modeTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  modeHint: { color: '#746B70', fontSize: 12, marginTop: 4 },
  errorText: { color: '#B4234B', fontSize: 12, fontWeight: '700', marginTop: 10 },
  flowButtons: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  backLink: { paddingHorizontal: 8, paddingVertical: 12 },
  backLinkText: { color: colors.syrup, fontSize: 14, fontWeight: '800' },
  demoNote: { color: '#82777E', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  guestQuota: { gap: 8, paddingTop: 8 },
  quotaChoice: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, borderColor: '#E9DDBE', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFCF4' },
  recentRoom: { alignItems: 'center', gap: 4, marginBottom: 14, padding: 12, borderWidth: 2, borderColor: colors.ink, borderRadius: 18, backgroundColor: colors.cream },
  code: { color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: 5 },
});
