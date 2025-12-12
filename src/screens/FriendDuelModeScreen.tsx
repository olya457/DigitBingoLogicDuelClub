import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  Easing,
  ImageBackground,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { addRecord } from '../storage/records';

const AUTO_FEEDBACK = true;

type Props = NativeStackScreenProps<RootStackParamList, 'FriendDuelMode'>;
type GuessRow = { id: string; guess: string; bulls: number; cows: number };

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;
const IS_SE = H <= 667 || W <= 320;

const SLOT_SIZE = IS_SE ? 36 : IS_SMALL ? 42 : 48;
const CELL_SIZE = IS_SE ? 38 : IS_SMALL ? 46 : 52;
const SUB_CAP_H = IS_SE ? 14 : IS_SMALL ? 16 : 18;
const BTN_H = IS_SE ? 40 : IS_SMALL ? 46 : 50;
const PAD_H = IS_SE ? 8 : 12;
const PAD_X = 16;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];
const FB_COLORS = ['#6A6F7A', '#F6D04D', '#2CC56A'] as const;
const BLUE_BG = '#0E1C4A';

const fs = (n: number) => (IS_SE ? n - 2 : IS_SMALL ? n - 1 : n);
const keyW = (W - PAD_X * 2 - 10 * 2) / 3;

const fmt = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

function autoStates(guess: string, secret: string): [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2] {
  const out: (0 | 1 | 2)[] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) out[i] = 2;
    else if (secret.includes(guess[i])) out[i] = 1;
  }
  return out as any;
}

export default function FriendDuelModeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [myCode, setMyCode] = useState('');
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState('');
  const [history, setHistory] = useState<GuessRow[]>([]);
  const [paused, setPaused] = useState(false);
  const [friendWon, setFriendWon] = useState(false);
  const [cracked, setCracked] = useState<null | { attempts: number; time: number }>(null);
  const [revealed, setRevealed] = useState<(string | null)[]>([null, null, null, null]);
  const lastGuessDigits = useMemo(() => {
    const g = history[0]?.guess ?? '';
    return [g[0] ?? '', g[1] ?? '', g[2] ?? '', g[3] ?? ''];
  }, [history]);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => {
    if (started) startTimer();
    else {
      stopTimer();
      setElapsed(0);
    }
    return () => stopTimer();
  }, [started]);

  const [fbOpen, setFbOpen] = useState(false);
  const [fbStates, setFbStates] = useState<[0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]>([0, 0, 0, 0]);
  const pendingGuess = useRef<string>('');
  const fbScore = (arr: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]) => {
    let bulls = 0,
      cows = 0;
    arr.forEach((s) => {
      if (s === 2) bulls++;
      else if (s === 1) cows++;
    });
    return { bulls, cows };
  };

  const aHeader = useRef(new Animated.Value(0)).current;
  const aSlots = useRef(new Animated.Value(0)).current;
  const aEntry = useRef(new Animated.Value(0)).current;
  const aHist = useRef(new Animated.Value(0)).current;
  const aKeys = useRef(new Animated.Value(0)).current;

  const slotScales = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(aHeader, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aSlots, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aEntry, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aHist, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aKeys, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const bounceSlot = (idx: number) => {
    Animated.sequence([
      Animated.spring(slotScales[idx], { toValue: 1.1, useNativeDriver: true, tension: 170, friction: 8 }),
      Animated.spring(slotScales[idx], { toValue: 1.0, useNativeDriver: true, tension: 170, friction: 10 }),
    ]).start();
  };

  const onKey = (k: string) => {
    if (paused) return;
    const target = started ? current : myCode;

    if (k === '⌫') {
      const s = target.slice(0, -1);
      started ? setCurrent(s) : setMyCode(s);
      return;
    }
    if (k === 'OK') {
      if (!started) {
        if (myCode.length === 4) setStarted(true);
      } else if (current.length === 4) {
        if (AUTO_FEEDBACK && myCode.length === 4) {
          const states = autoStates(current, myCode);
          const { bulls, cows } = fbScore(states);
          const next = [...revealed];
          for (let i = 0; i < 4; i++) {
            if (states[i] === 2 && next[i] !== current[i]) {
              next[i] = current[i];
              bounceSlot(i);
            }
          }
          setRevealed(next);
          setHistory((prev) => [{ id: `${Date.now()}`, guess: current, bulls, cows }, ...prev]);
          setCurrent('');
          if (bulls === 4) {
            const attempts = history.length + 1;
            stopTimer();
            setCracked({ attempts, time: elapsed });
            addRecord({
              id: `${Date.now()}`,
              mode: 'duel',
              tries: attempts,
              timeSec: elapsed,
              createdAt: Date.now(),
            });
          }
        } else {
          pendingGuess.current = current;
          setFbStates([0, 0, 0, 0]);
          setFbOpen(true);
        }
      }
      return;
    }
    if (target.length >= 4) return;
    if (target.length === 0 && k === '0') return;
    started ? setCurrent(target + k) : setMyCode(target + k);
  };

  const saveFeedback = () => {
    const { bulls, cows } = fbScore(fbStates);
    const g = pendingGuess.current;
    const next = [...revealed];
    for (let i = 0; i < 4; i++) {
      if (fbStates[i] === 2 && next[i] !== g[i]) {
        next[i] = g[i];
        bounceSlot(i);
      }
    }
    setRevealed(next);
    setHistory((prev) => [{ id: `${Date.now()}`, guess: g, bulls, cows }, ...prev]);
    setFbOpen(false);
    setCurrent('');
    if (bulls === 4) {
      const attempts = history.length + 1;
      stopTimer();
      setCracked({ attempts, time: elapsed });
      addRecord({
        id: `${Date.now()}`,
        mode: 'duel',
        tries: attempts,
        timeSec: elapsed,
        createdAt: Date.now(),
      });
    }
  };

  const resetDuel = () => {
    setStarted(false);
    setMyCode('');
    setCurrent('');
    setHistory([]);
    setFriendWon(false);
    setCracked(null);
    setFbOpen(false);
    setRevealed([null, null, null, null]);
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../assets/background.png')} style={styles.bg} resizeMode="cover">
        <Animated.View
          style={{
            opacity: aHeader,
            transform: [{ translateY: aHeader.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View style={[styles.header, { paddingTop: (insets.top || 0) + PAD_H + 16 }]}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backTxt}>‹</Text>
            </Pressable>

            <View style={styles.timerPill}>
              <Text style={styles.timerTxt}>{fmt(elapsed)}</Text>
            </View>

            <View style={styles.headerBtns}>
              <Pressable
                style={styles.hIcon}
                onPress={() => {
                  setPaused(true);
                  stopTimer();
                }}
              >
                <Text style={styles.hIconTxt}>⏸</Text>
              </Pressable>
              <Pressable style={styles.hIcon} onPress={() => setFriendWon(true)}>
                <Text style={styles.hIconTxt}>🚩</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.modeTitleWrap}>
            <Text style={styles.modeTitle}>FRIEND DUEL MODE</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: aSlots,
            transform: [{ translateY: aSlots.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          {!started ? (
            <>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Create Your Code</Text>
              </View>
              <View style={styles.currentRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={styles.currentCell}>
                    <Text style={styles.currentCellTxt}>{myCode[i] ?? ''}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                style={[styles.submitBtn, { opacity: myCode.length === 4 ? 1 : 0.6 }]}
                onPress={() => myCode.length === 4 && setStarted(true)}
              >
                <Text style={styles.submitTxt}>START FRIEND DUEL</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.slotsBlock}>
              {Array.from({ length: 4 }).map((_, i) => {
                const hit = !!revealed[i];
                const capText = hit ? revealed[i]! : lastGuessDigits[i] || ' ';
                return (
                  <View key={i} style={styles.slotCol}>
                    <Animated.View style={[styles.slotWrap, { transform: [{ scale: slotScales[i] }] }]}>
                      <View style={[styles.slot, hit && styles.slotGreen]}>
                        <Text style={[styles.slotTxt, hit && styles.slotTxtOn]}>{revealed[i] ?? '?'}</Text>
                      </View>
                    </Animated.View>
                    <View style={[styles.subCap, hit ? styles.subCapGreen : styles.subCapBlue]}>
                      <Text style={[styles.subCapTxt, hit && styles.subCapTxtOn]}>{capText}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={styles.attemptPill}>
                <Text style={styles.attemptTxt}>{`${history.length} tries`}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={{
            opacity: aEntry,
            transform: [{ translateY: aEntry.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          {started && (
            <>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Enter your guess</Text>
              </View>
              <View style={styles.currentRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={styles.currentCell}>
                    <Text style={styles.currentCellTxt}>{current[i] ?? ''}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={[styles.submitBtn, { opacity: current.length === 4 ? 1 : 0.6 }]} onPress={() => onKey('OK')}>
                <Text style={styles.submitTxt}>SUBMIT GUESS</Text>
              </Pressable>
            </>
          )}
        </Animated.View>

        {history.length > 0 && (
          <Animated.View
            style={{
              flex: 1,
              opacity: aHist,
              transform: [{ translateY: aHist.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            }}
          >
            <View style={styles.historyWrap}>
              <FlatList
                data={history}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <Text style={styles.hGuess}>{item.guess}</Text>
                    <View style={styles.hFeedback}>
                      <View style={[styles.fbDot, styles.fbGreen]} />
                      <Text style={styles.fbTxt}>{item.bulls}</Text>
                      <View style={[styles.fbDot, styles.fbYellow]} />
                      <Text style={styles.fbTxt}>{item.cows}</Text>
                    </View>
                  </View>
                )}
              />
            </View>
          </Animated.View>
        )}

        <Animated.View
          style={{
            opacity: aKeys,
            transform: [{ translateY: aKeys.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }}
        >
          <View style={[styles.keypad, { paddingBottom: (insets.bottom || 0) + PAD_H }]}>
            {KEYS.map((k) => (
              <Pressable key={k} onPress={() => onKey(k)} style={[styles.key, k === 'OK' && styles.keyOk]}>
                <Text style={[styles.keyTxt, k === 'OK' && styles.keyOkTxt]}>{k}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Modal transparent visible={fbOpen && !AUTO_FEEDBACK} animationType="fade" onRequestClose={() => setFbOpen(false)}>
          <View style={styles.modalBack}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Mark Feedback</Text>
              <View style={styles.fbRow}>
                {fbStates.map((s, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      const next = (s + 1) as 0 | 1 | 2;
                      setFbStates((prev) => {
                        const c = [...prev] as typeof fbStates;
                        c[idx] = next;
                        return c;
                      });
                    }}
                    style={[styles.fbBtn, { backgroundColor: FB_COLORS[s] }]}
                  >
                    <Text style={[styles.fbBtnTxt, { color: '#0F1115' }]}>{pendingGuess.current[idx]}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.bigYellowBtn} onPress={saveFeedback}>
                <Text style={styles.bigYellowTxt}>SAVE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={friendWon} animationType="fade" onRequestClose={() => setFriendWon(false)}>
          <View style={styles.modalBack}>
            <View style={styles.infoCardCentered}>
              <Image source={require('../assets/white_flag.png')} style={{ width: 86, height: 64, marginBottom: 6 }} />
              <Text style={styles.modalTitle}>Friend Guessed the Code</Text>
              <Text style={styles.infoTextCenter}>
                Your friend claims they’ve locked onto the secret code first. You may keep playing, restart, or go home.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <Pressable style={[styles.bigYellowBtn, { flex: 1 }]} onPress={() => setFriendWon(false)}>
                  <Text style={styles.bigYellowTxt}>OK</Text>
                </Pressable>
                <Pressable style={[styles.bigYellowBtn, { flex: 1 }]} onPress={resetDuel}>
                  <Text style={styles.bigYellowTxt}>RESTART</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={paused} animationType="fade" onRequestClose={() => setPaused(false)}>
          <View style={styles.modalBack}>
            <View style={styles.infoCard}>
              <Text style={styles.modalTitle}>Game Paused</Text>
              <Text style={styles.infoText}>Your current state is on hold, but every guess you made is still in place.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  style={[styles.bigYellowBtn, { flex: 1 }]}
                  onPress={() => {
                    setPaused(false);
                    startTimer();
                  }}
                >
                  <Text style={styles.bigYellowTxt}>RESUME</Text>
                </Pressable>
                <Pressable style={[styles.bigYellowBtn, { flex: 1 }]} onPress={resetDuel}>
                  <Text style={styles.bigYellowTxt}>RESTART</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={!!cracked} animationType="fade" onRequestClose={() => setCracked(null)}>
          <View style={styles.modalBack}>
            <View style={styles.infoCardCentered}>
              <Image source={require('../assets/confetti.png')} style={{ width: 104, height: 104, marginBottom: 6 }} resizeMode="contain" />
              <Text style={styles.modalTitle}>Code Cracked!</Text>
              <Text style={styles.infoTextCenter}>
                You solved the code in {cracked?.attempts} guesses • Time {fmt(cracked?.time ?? 0)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <Pressable style={[styles.bigYellowBtn, { flex: 1 }]} onPress={resetDuel}>
                  <Text style={styles.bigYellowTxt}>PLAY AGAIN</Text>
                </Pressable>
                <Pressable style={[styles.bigYellowBtn, { flex: 1 }]} onPress={() => navigation.goBack()}>
                  <Text style={styles.bigYellowTxt}>HOME</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  bg: { flex: 1 },

  header: {
    paddingHorizontal: PAD_X,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width: BTN_H,
    height: BTN_H,
    borderRadius: 14,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { color: '#1A1F2B', fontWeight: '900', fontSize: fs(26), marginTop: -2 },

  timerPill: {
    height: BTN_H,
    minWidth: IS_SE ? 96 : 110,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTxt: { color: '#1A1F2B', fontWeight: '900', letterSpacing: 0.5, fontSize: fs(14) },

  headerBtns: { flexDirection: 'row', gap: 10 },
  hIcon: {
    width: BTN_H,
    height: BTN_H,
    borderRadius: 12,
    backgroundColor: BLUE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hIconTxt: { color: '#E8ECF1', fontSize: fs(16), fontWeight: '900' },

  modeTitleWrap: { alignItems: 'center', marginTop: PAD_H },
  modeTitle: { color: '#E8ECF1', fontWeight: '800', letterSpacing: 0.4, fontSize: fs(14) },

  slotsBlock: {
    paddingHorizontal: PAD_X,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  slotCol: { width: SLOT_SIZE, alignItems: 'center' },
  slotWrap: { width: SLOT_SIZE, height: SLOT_SIZE },
  slot: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#13214A',
    borderWidth: 2,
    borderColor: '#3557B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotGreen: { backgroundColor: '#1E5E34', borderColor: '#2CC56A' },
  slotTxt: { color: '#E8ECF1', fontWeight: '800', fontSize: fs(18) },
  slotTxtOn: { color: '#E8FFE8' },

  subCap: {
    marginTop: 6,
    width: SLOT_SIZE,
    height: SUB_CAP_H,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCapBlue: { backgroundColor: '#21408E' },
  subCapGreen: { backgroundColor: '#2CC56A' },
  subCapTxt: { color: '#DDE7FF', fontSize: fs(10), fontWeight: '800' },
  subCapTxtOn: { color: '#0F1115' },

  attemptPill: {
    marginLeft: 'auto',
    height: BTN_H - 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: BLUE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attemptTxt: { color: '#E8ECF1', fontWeight: '700', fontSize: fs(12) },
  sectionTitleWrap: { paddingHorizontal: PAD_X, marginTop: 10 },
  sectionTitle: { color: '#E8ECF1', fontSize: fs(14), fontWeight: '700' },

  currentRow: {
    paddingHorizontal: PAD_X,
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  currentCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    backgroundColor: '#A3282F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCellTxt: { color: '#fff', fontSize: fs(18), fontWeight: '900' },

  submitBtn: {
    marginHorizontal: PAD_X,
    height: BTN_H,
    borderRadius: 14,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitTxt: { color: '#1A1F2B', fontSize: fs(15), fontWeight: '900', letterSpacing: 0.5 },
  historyWrap: { flex: 1, paddingHorizontal: PAD_X, paddingTop: 6 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  hGuess: { color: '#E8ECF1', fontSize: fs(16), fontWeight: '800' },
  hFeedback: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fbDot: { width: 12, height: 12, borderRadius: 6 },
  fbGreen: { backgroundColor: '#2CC56A' },
  fbYellow: { backgroundColor: '#F6D04D' },
  fbTxt: { color: '#E8ECF1', fontWeight: '700' },
  keypad: {
    paddingHorizontal: PAD_X,
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  key: {
    width: keyW,
    height: BTN_H,
    borderRadius: 12,
    backgroundColor: BLUE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyOk: { backgroundColor: '#5B8CFF' },
  keyTxt: { color: '#E8ECF1', fontSize: fs(18), fontWeight: '800' },
  keyOkTxt: { color: '#fff' },
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: PAD_X,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: BLUE_BG,
    padding: 16,
    gap: 12,
  },
  modalTitle: { color: '#E8ECF1', fontSize: fs(18), fontWeight: '900', textAlign: 'center' },

  fbRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  fbBtn: { flex: 1, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fbBtnTxt: { fontSize: fs(18), fontWeight: '900' },

  bigYellowBtn: {
    height: BTN_H,
    borderRadius: 12,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  bigYellowTxt: { color: '#1A1F2B', fontSize: fs(15), fontWeight: '900' },

  infoCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: BLUE_BG,
    padding: 16,
    gap: 12,
  },
  infoCardCentered: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: BLUE_BG,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  infoText: { color: '#E8ECF1', fontSize: fs(14), lineHeight: 20 },
  infoTextCenter: { color: '#E8ECF1', fontSize: fs(14), lineHeight: 20, textAlign: 'center' },
});
