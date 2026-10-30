import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@wafflr/design-tokens';
import type { DecisionCard, RoomSummary, VoteChoice } from '@wafflr/shared-types';
import { addCard, chooseWinner, deleteCard, getRoundResult, listCards, startTieBreak, startVoting, submitBallot, updateCard } from '../lib/rooms-api';
import { createLocalSimulatorGuest, getActiveLocalParticipantRole, switchLocalSimulatorToCreator } from '../lib/local-database';

type Props = { room: RoomSummary & { status?: 'Created' | 'Joined' }; onBack: () => void };
type RoundState = { phase: string; round: number; winner?: DecisionCard; tiedCards?: DecisionCard[]; scores?: { cardId: string; yepCount: number }[] };

function Action({ title, onPress, disabled = false, quiet = false }: { title: string; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.action, quiet && s.quiet, disabled && s.disabled]}><Text style={[s.actionText, quiet && s.quietText]}>{title}</Text></Pressable>;
}

export default function RoomScreen({ room, onBack }: Props) {
  const [cards, setCards] = useState<DecisionCard[]>([]);
  const [roundCards, setRoundCards] = useState<DecisionCard[] | null>(null);
  const [round, setRound] = useState<RoundState>({ phase: room.phase, round: 1 });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, VoteChoice>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isCreator, setIsCreator] = useState(room.status === undefined || room.status === 'Created');
  const visibleCards = roundCards ?? cards;
  const voteComplete = visibleCards.length >= 2 && visibleCards.every(card => votes[card.id]);
  const titleForPhase = round.phase === 'completed' ? 'We have a winner!' :
    round.phase === 'voting' ? (round.round > 1 ? 'Tie-breaker round' : 'Cast your votes') :
    round.phase === 'round_reveal' ? 'It’s a tie!' : 'Build the deck';

  const refresh = async () => {
    const [nextCards, result, role] = await Promise.all([listCards(room.id), getRoundResult(room.id), getActiveLocalParticipantRole(room.id)]);
    setCards(nextCards);
    setIsCreator(role === 'creator');
    if (result) {
      setRound(result);
      if (result.tiedCards) setRoundCards(result.tiedCards);
    }
  };

  useEffect(() => { void refresh().catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load this room.')); }, [room.id]);

  const addSimulatorGuest = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      await createLocalSimulatorGuest(room.id);
      setVotes({});
      await refresh();
      setNotice('Switched to an anonymous guest. You can now contribute and vote as that participant.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add a simulator participant.'); }
    finally { setBusy(false); }
  };

  const returnToCreator = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      await switchLocalSimulatorToCreator(room.id);
      setVotes({});
      await refresh();
      setNotice('Switched back to the room creator.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not switch participants.'); }
    finally { setBusy(false); }
  };

  const saveChoice = async () => {
    if (!title.trim() || busy) return;
    setBusy(true); setError('');
    try {
      if (editingCardId) {
        await updateCard(room.id, editingCardId, { title, category, location });
        setCards(current => current.map(card => card.id === editingCardId ? { ...card, title, category: category || undefined, location: location || undefined } : card));
        setNotice('Choice updated.');
      } else {
        const card = await addCard(room.id, { title, category, location });
        setCards(current => [...current, card]);
        setNotice('Choice added.');
      }
      setTitle(''); setCategory(''); setLocation(''); setEditingCardId(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save that choice.'); }
    finally { setBusy(false); }
  };

  const removeChoice = async (cardId: string) => {
    try { await deleteCard(room.id, cardId); setCards(current => current.filter(card => card.id !== cardId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove that choice.'); }
  };

  const beginVoting = async () => {
    setBusy(true); setError('');
    try { await startVoting(room.id); setRound({ phase: 'voting', round: 1 }); setRoundCards(null); setVotes({}); setNotice('The deck is locked. Make your picks!'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start voting.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!voteComplete || busy) return;
    setBusy(true); setError('');
    try {
      const result = await submitBallot(room.id, visibleCards.map(card => ({ cardId: card.id, choice: votes[card.id] })));
      setRound(result);
      if (result.phase === 'round_reveal' && result.tiedCards) setRoundCards(result.tiedCards);
      if (result.phase === 'completed') setNotice('The group has spoken.');
      setVotes({});
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your ballot.'); }
    finally { setBusy(false); }
  };

  const nextTieBreak = async () => {
    setBusy(true); setError('');
    try {
      const tied = await startTieBreak(room.id);
      setRoundCards(tied);
      setRound({ phase: 'voting', round: round.round });
      setVotes({});
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start the tie-breaker.'); }
    finally { setBusy(false); }
  };

  const selectWinner = async (cardId: string) => {
    setBusy(true); setError('');
    try {
      await chooseWinner(room.id, cardId);
      const result = await getRoundResult(room.id);
      if (result) setRound(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not choose that winner.'); }
    finally { setBusy(false); }
  };

  const winner = round.winner ?? cards.find(card => card.id === round.winner?.id);
  const scoreMap = useMemo(() => new Map((round.scores ?? []).map(score => [score.cardId, score.yepCount])), [round.scores]);

  return <SafeAreaView style={s.safe}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" onPress={onBack} style={s.back}><Text style={s.backText}>‹ Home</Text></Pressable>
      <Text style={s.brand}>WAFFLR</Text>
      <View style={s.codePill}><Text style={s.codeText}>{room.code}</Text></View>
    </View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>{room.template.toUpperCase().replace('_', ' ')} · {round.phase.toUpperCase().replace('_', ' ')}</Text>
      <Text style={s.heading}>{titleForPhase}</Text>
      <Text style={s.subtitle}>{room.title}</Text>
      {__DEV__ && <View style={s.simulatorPanel}>
        <Text style={s.simulatorLabel}>LOCAL TESTING · {isCreator ? 'CREATOR' : 'GUEST'}</Text>
        <Action title={busy ? 'Switching…' : isCreator ? '＋ Add guest & switch' : '↩ Switch to creator'} quiet onPress={() => void (isCreator ? addSimulatorGuest() : returnToCreator())} disabled={busy} />
        <Text style={s.simulatorHint}>Development only. Each simulated participant has a separate anonymous credential.</Text>
      </View>}

      {round.phase === 'collecting' && <>
        {(room.mode === 'guests' || isCreator) && <View style={s.panel}>
          <Text style={s.panelTitle}>{room.mode === 'host' ? 'Add choices to your deck' : 'Add your choices'}</Text>
          <Text style={s.hint}>{room.mode === 'host' ? 'You’re building the full deck.' : 'Your group is building this deck together.'} Up to one hundred choices.</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder={room.template === 'restaurant' ? 'Restaurant name' : 'Choice name'} placeholderTextColor="#746B70" maxLength={120} style={s.input} />
          {room.template === 'restaurant' && <>
            <TextInput value={category} onChangeText={setCategory} placeholder="Cuisine (optional)" placeholderTextColor="#746B70" style={s.input} />
            <TextInput value={location} onChangeText={setLocation} placeholder="Location (optional)" placeholderTextColor="#746B70" style={s.input} />
          </>}
          <Action title={busy ? 'Saving…' : editingCardId ? 'Save changes' : 'Add choice'} onPress={() => void saveChoice()} disabled={!title.trim() || busy || cards.length >= 100} />
          {!!editingCardId && <Action title="Cancel edit" quiet onPress={() => { setEditingCardId(null); setTitle(''); setCategory(''); setLocation(''); }} />}
          <Text style={s.counter}>{cards.length} / 100 choices · {room.mode === 'guests' ? `Your choices: ${cards.filter(card => card.isMine).length} / ${room.cardsPerGuest ?? 1}` : 'Host-built deck'}</Text>
        </View>}
        <View style={s.panel}>
          <Text style={s.panelTitle}>The deck so far</Text>
          {cards.length === 0 ? <Text style={s.hint}>Your choices will appear here.</Text> : cards.map((card, index) => <View key={card.id} style={s.cardRow}>
            <View style={s.cardNumber}><Text style={s.cardNumberText}>{index + 1}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.cardTitle}>{card.title}</Text>{!!(card.category || card.location) && <Text style={s.hint}>{[card.category, card.location].filter(Boolean).join(' · ')}</Text>}</View>
            {(isCreator || card.canEdit) && <View style={{ flexDirection: 'row', gap: 6 }}><Pressable onPress={() => { setEditingCardId(card.id); setTitle(card.title); setCategory(card.category ?? ''); setLocation(card.location ?? ''); }} accessibilityLabel={'Edit ' + card.title} style={s.remove}><Text style={s.removeText}>✎</Text></Pressable><Pressable onPress={() => void removeChoice(card.id)} accessibilityLabel={'Remove ' + card.title} style={s.remove}><Text style={s.removeText}>×</Text></Pressable></View>}
          </View>)}
          {isCreator ? <Action title={busy ? 'Please wait…' : 'Start voting'} onPress={() => void beginVoting()} disabled={cards.length < 2 || busy} /> : <Text style={s.counter}>Waiting for the room creator to start voting.</Text>}
          {cards.length < 2 && <Text style={s.counter}>Add at least two choices to continue.</Text>}
        </View>
      </>}

      {round.phase === 'voting' && (round.hasSubmitted ? <View style={s.panel}><Text style={s.panelTitle}>Your votes are in!</Text><Text style={s.hint}>Waiting for the rest of the group to submit their private ballots.</Text></View> : <>
        <View style={s.panel}>
          <Text style={s.panelTitle}>Choose Yep or Nah for every card</Text>
          <Text style={s.hint}>Your votes stay private until everyone has submitted.</Text>
          {visibleCards.map((card, index) => <View key={card.id} style={s.voteCard}>
            <Text style={s.voteIndex}>CHOICE {index + 1}</Text>
            <Text style={s.voteTitle}>{card.title}</Text>
            <View style={s.voteActions}>
              <Pressable onPress={() => setVotes(current => ({ ...current, [card.id]: 'nah' }))} style={[s.voteButton, votes[card.id] === 'nah' && s.nahSelected]}><Text style={s.voteText}>Nah</Text></Pressable>
              <Pressable onPress={() => setVotes(current => ({ ...current, [card.id]: 'yep' }))} style={[s.voteButton, votes[card.id] === 'yep' && s.yepSelected]}><Text style={s.voteText}>Yep!</Text></Pressable>
            </View>
          </View>)}
          <Text style={s.counter}>{Object.keys(votes).length} of {visibleCards.length} voted</Text>
          <Action title={busy ? 'Submitting…' : 'Submit my votes'} onPress={() => void submit()} disabled={!voteComplete || busy} />
        </View>
      </>)}

      {round.phase === 'round_reveal' && <>
        <View style={s.panel}>
          <Text style={s.panelTitle}>A tie! These choices are still in the running.</Text>
          {(round.tiedCards ?? roundCards ?? []).map(card => <View key={card.id} style={s.cardRow}><Text style={s.cardTitle}>{card.title}</Text><Text style={s.counter}>{scoreMap.get(card.id) ?? '—'} Yep</Text></View>)}
          {round.round >= 3 ? <>
            <Text style={s.hint}>Another tie. The room creator picks the winner.</Text>
            {(round.tiedCards ?? roundCards ?? []).map(card => <Action key={card.id} title={'Choose ' + card.title} onPress={() => void selectWinner(card.id)} disabled={!isCreator || busy} />)}
          </> : <Action title="Start tie-breaker round" onPress={() => void nextTieBreak()} disabled={!isCreator || busy} />}
        </View>
      </>}

      {round.phase === 'completed' && winner && <View style={s.winnerPanel}>
        <Text style={s.winnerEmoji}>🏆</Text>
        <Text style={s.winnerLabel}>THE GROUP PICKED</Text>
        <Text style={s.winnerTitle}>{winner.title}</Text>
        {!!winner.category && <Text style={s.hint}>{winner.category}</Text>}
        {!!winner.location && <Text style={s.hint}>{winner.location}</Text>}
        <Text style={s.hint}>That’s a decision. Nice work.</Text>
      </View>}

      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!!notice && <Text style={s.notice}>{notice}</Text>}
      <Text style={s.footnote}>Room details are stored on this device for local testing.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  simulatorPanel: { marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B9A9C7', backgroundColor: '#F8F3FC', gap: 6 },
  simulatorLabel: { color: '#6E4A87', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  simulatorHint: { color: '#746B70', fontSize: 10, lineHeight: 14 },

  header: { minHeight: 58, paddingHorizontal: spacing.lg, borderBottomWidth: 2, borderBottomColor: colors.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { paddingVertical: 10, minWidth: 76 }, backText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  brand: { color: colors.ink, fontWeight: '900', letterSpacing: 2, fontSize: 17 },
  codePill: { borderRadius: radii.pill, backgroundColor: colors.butter, borderWidth: 1.5, borderColor: colors.ink, paddingHorizontal: 10, paddingVertical: 6 },
  codeText: { color: colors.ink, fontWeight: '900', letterSpacing: 1.5 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: spacing.lg, gap: 13 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 8 },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: '#746B70', fontSize: 15, fontWeight: '700', marginTop: -8 },
  panel: { backgroundColor: colors.cream, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.ink, padding: spacing.md, gap: 10 },
  panelTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  hint: { color: '#746B70', fontSize: 13, lineHeight: 18 },
  input: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 12, color: colors.ink, fontSize: 15 },
  action: { minHeight: 48, borderRadius: radii.md, backgroundColor: colors.butter, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  quiet: { backgroundColor: colors.white }, quietText: { color: colors.ink },
  disabled: { opacity: .42 },
  counter: { color: '#746B70', fontSize: 12, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#E6DCD2' },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', flex: 1 },
  remove: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ink },
  removeText: { color: colors.ink, fontWeight: '900', fontSize: 20 },
  voteCard: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink, borderRadius: radii.md, padding: spacing.md, gap: 10 },
  voteIndex: { color: colors.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1.3 },
  voteTitle: { color: colors.ink, fontWeight: '900', fontSize: 20 },
  voteActions: { flexDirection: 'row', gap: 10 },
  voteButton: { flex: 1, minHeight: 43, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  nahSelected: { backgroundColor: '#E8B7C5' }, yepSelected: { backgroundColor: '#A9D9B5' },
  voteText: { color: colors.ink, fontWeight: '900' },
  winnerPanel: { backgroundColor: colors.butter, borderWidth: 2, borderColor: colors.ink, borderRadius: radii.lg, alignItems: 'center', padding: 24, gap: 8 },
  winnerEmoji: { fontSize: 54 }, winnerLabel: { color: colors.ink, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  winnerTitle: { color: colors.ink, fontSize: 29, fontWeight: '900', textAlign: 'center' },
  error: { color: '#B4233B', fontWeight: '700' }, notice: { color: '#287A49', fontWeight: '700' },
  footnote: { color: '#746B70', textAlign: 'center', fontSize: 11, marginVertical: 12 },
});
