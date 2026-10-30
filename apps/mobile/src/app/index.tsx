import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@wafflr/design-tokens';

type Room = { id: string; title: string; code: string; status: string; updated: string };
const ROOMS: Room[] = [
  { id: '1', title: 'Friday Night Food', code: 'FRY123', status: 'Created', updated: 'Just now' },
  { id: '2', title: 'Movie Night', code: 'MOV456', status: 'Joined', updated: 'Yesterday' },
  { id: '3', title: 'Weekend Plans', code: 'FUN789', status: 'Created', updated: 'Yesterday' },
];

function Button({ label, onPress, accent = false, compact = false }: { label: string; onPress: () => void; accent?: boolean; compact?: boolean }) {
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[motion, compact && { width: '100%' }]}><Pressable accessibilityRole="button" onPress={onPress} onPressIn={() => { scale.value = withSpring(.96); }} onPressOut={() => { scale.value = withSpring(1); }} style={[s.button, { backgroundColor: accent ? colors.accent : colors.butter }, compact && s.compactButton]}><Text style={[s.buttonText, accent && { color: colors.white }]}>{label}</Text></Pressable></Animated.View>;
}

function Rooms({ close }: { close: () => void }) {
  const [share, setShare] = useState<Room | null>(null);
  return <Animated.View entering={FadeIn.duration(150)} style={s.backdrop}>
    <Pressable accessibilityLabel="Close rooms" onPress={close} style={StyleSheet.absoluteFill} />
    <Animated.View entering={FadeInDown.springify()} style={s.modal}>
      <View style={s.modalHead}><Text style={s.modalTitle}>Your Rooms</Text><Pressable onPress={close} style={s.close}><Text style={s.closeText}>×</Text></Pressable></View>
      <View style={s.counts}><View style={s.count}><Text style={s.countNum}>2</Text><Text style={s.countLabel}>Created</Text></View><View style={s.count}><Text style={s.countNum}>1</Text><Text style={s.countLabel}>Joined</Text></View></View>
      <ScrollView contentContainerStyle={{ gap: 9 }}>
        {ROOMS.map(room => <View key={room.id} style={s.room}>
          <Pressable onPress={() => setShare(room)} style={s.roomMain}><View style={s.roomIcon}><Text style={s.roomInitial}>{room.title[0]}</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={s.roomTitle}>{room.title}</Text><Text style={s.roomMeta}>{room.status} · {room.updated}</Text></View></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Share ' + room.title} onPress={() => setShare(room)} style={s.qr}><Text style={{ fontSize: 23, color: colors.ink }}>▦</Text></Pressable>
        </View>)}
      </ScrollView>
      {share && <View style={s.share}><Text style={s.roomTitle}>Share {share.title}</Text><Text style={s.code}>{share.code}</Text><Text style={s.roomMeta}>Demo code — QR sharing comes later</Text><Button label="Done" compact onPress={() => setShare(null)} /></View>}
    </Animated.View>
  </Animated.View>;
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<'home' | 'winner'>('home');
  const [rooms, setRooms] = useState(false);
  const [backVisible, setBackVisible] = useState(false);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (screen !== 'winner') { setBackVisible(false); return; }
    const timer = setTimeout(() => setBackVisible(true), 2200);
    return () => clearTimeout(timer);
  }, [screen]);
  const goWinner = () => { setRooms(false); setScreen('winner'); };
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}><View style={s.shell}>
    <View style={s.header}>
      <View style={s.brand}><View style={s.miniWaffle}><Text style={{ color: colors.syrup, fontSize: 16 }}>▦</Text></View><Text style={s.brandText}>WAFFLR</Text></View>
      <Pressable accessibilityRole="button" onPress={() => setRooms(true)} style={s.roomsButton}><Text style={s.roomsLabel}>Your Rooms</Text><View style={s.badge}><Text style={s.badgeText}>{ROOMS.length}</Text></View></Pressable>
    </View>
    {screen === 'home' ? <Animated.View entering={FadeIn.duration(220)} style={s.home}>
      <View style={s.hero}>
        <Animated.View entering={FadeInDown.delay(80).springify()} style={s.butters}><View style={s.waffleGrid}>{Array.from({ length: 16 }, (_, i) => <View key={i} style={s.waffleCell} />)}</View><View style={s.face}><View style={s.eyes}><View style={s.eye} /><View style={s.eye} /></View><View style={s.smile} /></View><Text style={s.sparkle}>✦</Text></Animated.View>
        <Animated.Text entering={FadeInDown.delay(150).springify()} style={[s.wordmark, width < 390 && { fontSize: 40 }]}>WAFFLR</Animated.Text><Text style={s.tagline}>Stop waffling. Start deciding.</Text>
      </View>
      <View style={s.actions}><View style={{ flex: 1 }}><Button label="Create Room" onPress={goWinner} /></View><View style={{ flex: 1 }}><Button label="Join Room" accent onPress={goWinner} /></View></View>
      <Text style={s.footer}>A little help for the big “what should we do?”</Text>
    </Animated.View> : <View style={s.winner}>
      <Animated.View entering={FadeInDown.delay(80).springify()} style={{ alignItems: 'center', marginBottom: 16 }}><Text style={s.eyebrow}>THE GROUP HAS SPOKEN</Text><Text style={s.winnerHeading}>And the winner is…</Text></Animated.View>
      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.winnerCard}><View style={s.foodArt}><View style={s.plate}><Text style={{ fontSize: 59 }}>🍕</Text></View></View><Text style={s.winnerLabel}>TONIGHT'S PICK</Text><Text style={s.winnerName}>Bob's Pizza Joint</Text><Text style={s.category}>Pizza · Italian</Text></Animated.View>
      <View style={s.stars}>{[0, 1, 2].map(i => <Animated.Text key={i} entering={FadeInDown.delay(400 + i * 230).springify().damping(8)} style={[s.star, i === 1 && s.bigStar]}>★</Animated.Text>)}</View>
      {backVisible ? <Animated.View entering={FadeIn.duration(160)} style={{ width: '100%', maxWidth: 340, marginTop: 8 }}><Button label="Back to Home" compact onPress={() => setScreen('home')} /></Animated.View> : <Text style={s.waiting}>Picking a winner…</Text>}
    </View>}
    <Text style={s.copyright}>© WAFFLR</Text>
  </View>{rooms && <Rooms close={() => setRooms(false)} />}</SafeAreaView>;
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
  code: { color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: 5 },
});
