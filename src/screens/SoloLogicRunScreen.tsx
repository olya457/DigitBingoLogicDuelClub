import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  ImageBackground,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { addRecord } from '../storage/records';

type Props = NativeStackScreenProps<RootStackParamList, 'SoloLogicRun'>;
type GuessItem = { id: string; guess: string; bulls: number; cows: number };

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;
const IS_SE    = H <= 667 || W <= 320;

const SLOT   = IS_SE ? 38 : IS_SMALL ? 42 : 48;
const SUBH   = IS_SE ? 16 : 18;
const CELL   = IS_SE ? 40 : IS_SMALL ? 46 : 52;
const BTN_H  = IS_SE ? 42 : IS_SMALL ? 46 : 50;
const SIDE   = 16;
const KEYS   = ['1','2','3','4','5','6','7','8','9','⌫','0','OK'];

function genSecret(allowRepeats: boolean): string {
  const d = ['0','1','2','3','4','5','6','7','8','9'];
  let s = '';
  while (s.length < 4) {
    const x = d[Math.floor(Math.random()*d.length)];
    if (s.length === 0 && x === '0') continue; 
    if (allowRepeats || !s.includes(x)) s += x;
  }
  return s;
}
function score(guess: string, secret: string): { bulls: number; cows: number } {
  let bulls = 0, cows = 0;
  for (let i=0;i<4;i++){
    if (guess[i] === secret[i]) bulls++;
    else if (secret.includes(guess[i])) cows++;
  }
  return { bulls, cows };
}
const fmt = (t:number) => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;

export default function SoloLogicRunScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [allowRepeats, setAllowRepeats] = useState<boolean|null>(null);
  const [secret, setSecret]     = useState('');
  const [current, setCurrent]   = useState('');
  const [history, setHistory]   = useState<GuessItem[]>([]);
  const [revealed, setRevealed] = useState<(string|null)[]>([null,null,null,null]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(()=> setElapsed(t=>t+1), 1000);
  };
  const stopTimer  = () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
  const [paused, setPaused] = useState(false);
  const [won, setWon]       = useState<null | { attempts:number; time:number }>(null);
  const aOpacity = useRef(new Animated.Value(0)).current;
  const aY       = useRef(new Animated.Value(12)).current;
  useEffect(()=>{
    Animated.parallel([
      Animated.timing(aOpacity,{toValue:1,duration:420,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
      Animated.timing(aY,{toValue:0,duration:420,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
    ]).start();
  },[]);

  const hitScales = [0,1,2,3].map(()=> useRef(new Animated.Value(1)).current);
  const pulse = (i:number) => {
    Animated.sequence([
      Animated.timing(hitScales[i], { toValue: 1.08, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(hitScales[i], { toValue: 1.00, duration: 140, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(()=>{
    if (allowRepeats !== null){
      setSecret(genSecret(allowRepeats));
      setCurrent(''); setHistory([]); setRevealed([null,null,null,null]);
      setWon(null); setElapsed(0); startTimer();
    } else stopTimer();
    return ()=> stopTimer();
  },[allowRepeats]);

  const lastDigits = useMemo(()=>{
    const g = history[0]?.guess ?? '';
    return [g[0] ?? '', g[1] ?? '', g[2] ?? '', g[3] ?? ''];
  },[history]);

  const onKey = (k:string) => {
    if (won || paused || allowRepeats === null) return;
    if (k === '⌫') { setCurrent(s=>s.slice(0,-1)); return; }
    if (k === 'OK') { submitGuess(); return; }
    if (current.length >= 4) return;
    if (!allowRepeats && current.includes(k)) return;
    if (current.length === 0 && k === '0') return;
    setCurrent(s=>s+k);
  };

  const submitGuess = () => {
    if (current.length !== 4) return;
    const res = score(current, secret);

    const next = [...revealed];
    for (let i=0;i<4;i++){
      if (current[i] === secret[i]) { next[i] = current[i]; pulse(i); }
    }
    setRevealed(next);

    const item: GuessItem = { id: `${Date.now()}`, guess: current, bulls: res.bulls, cows: res.cows };
    setHistory(prev => [item, ...prev]);
    setCurrent('');

    if (res.bulls === 4){
      stopTimer();
      const attempts = history.length + 1;
      setWon({ attempts, time: elapsed });
      addRecord({ id: `${Date.now()}`, mode: 'solo', tries: attempts, timeSec: elapsed, createdAt: Date.now() });
    }
  };

  const resetGame = () => {
    if (allowRepeats === null) return;
    setSecret(genSecret(allowRepeats));
    setCurrent(''); setHistory([]); setRevealed([null,null,null,null]);
    setWon(null); setElapsed(0); startTimer();
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../assets/background.png')} style={styles.bg} resizeMode="cover">
        <View style={[styles.header,{paddingTop:(insets.top||0)+8+24}]}>
          <Pressable style={styles.backBtn} onPress={()=>navigation.goBack()}>
            <Text style={styles.backTxt}>‹</Text>
          </Pressable>

          <View style={styles.timerPill}>
            <Text style={styles.timerTxt}>{fmt(elapsed)}</Text>
          </View>

          <View style={styles.headerBtns}>
            <Pressable style={styles.hIcon} onPress={()=>setPaused(true)}>
              <Text style={styles.hIconTxt}>⏸</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={{opacity:aOpacity, transform:[{translateY:aY}]}}>
          <View style={styles.slotsRow}>
            {Array.from({length:4}).map((_,i)=>{
              const d = revealed[i];
              return (
                <Animated.View key={i} style={[styles.slotWrap, {transform:[{scale: hitScales[i]}]}]}>
                  <View style={[styles.slot, d && styles.slotGreen]}>
                    <Text style={[styles.slotTxt, d && styles.slotTxtOn]}>{d ?? '?'}</Text>
                  </View>
                  <View style={[styles.subCap, (d && lastDigits[i]===d) ? styles.subCapGreen : styles.subCapBlue]}>
                    <Text style={[styles.subCapTxt, (d && lastDigits[i]===d) && styles.subCapTxtOn]}>
                      {lastDigits[i] || ' '}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
            <View style={styles.attemptPill}><Text style={styles.attemptTxt}>{`${history.length} tries`}</Text></View>
          </View>
          <View style={styles.sectionTitleWrap}><Text style={styles.sectionTitle}>Enter your guess</Text></View>
          <View style={styles.currentRow}>
            {Array.from({length:4}).map((_,i)=>(
              <View key={i} style={styles.currentCell}>
                <Text style={styles.currentCellTxt}>{current[i] ?? ''}</Text>
              </View>
            ))}
          </View>
          <Pressable style={[styles.submitBtn,{opacity: current.length===4 ? 1 : 0.6}]} onPress={submitGuess}>
            <Text style={styles.submitTxt}>SUBMIT GUESS</Text>
          </Pressable>
        </Animated.View>

        {history.length>0 && (
          <View style={styles.historyWrap}>
            <FlatList
              data={history}
              keyExtractor={(it)=>it.id}
              renderItem={({item})=>(
                <View style={styles.historyItem}>
                  <Text style={styles.hGuess}>{item.guess}</Text>
                  <View style={styles.hFeedback}>
                    <View style={[styles.fbDot, styles.fbGreen]} /><Text style={styles.fbTxt}>{item.bulls}</Text>
                    <View style={[styles.fbDot, styles.fbYellow]} /><Text style={styles.fbTxt}>{item.cows}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        <View style={[styles.keypad,{paddingBottom:(insets.bottom||0)+8}]}>
          {KEYS.map(k=>(
            <Pressable key={k} onPress={()=>onKey(k)} style={[styles.key, k==='OK' && styles.keyOk]}>
              <Text style={[styles.keyTxt, k==='OK' && styles.keyOkTxt]}>{k}</Text>
            </Pressable>
          ))}
        </View>

        <Modal transparent visible={allowRepeats===null} animationType="fade">
          <View style={styles.modalBack}>
            <View style={styles.darkCard}>
              <Text style={styles.modalTitle}>Digit Repetitions</Text>
              <Text style={styles.modalSub}>Choose code generation mode</Text>
              <View style={styles.toggleRow}>
                <Pressable style={[styles.toggleBtn, allowRepeats===false && styles.toggleActive]} onPress={()=>setAllowRepeats(false)}>
                  <Text style={[styles.toggleTxt, allowRepeats===false && styles.toggleTxtActive]}>No Repeats</Text>
                </Pressable>
                <Pressable style={[styles.toggleBtn, allowRepeats===true && styles.toggleActive]} onPress={()=>setAllowRepeats(true)}>
                  <Text style={[styles.toggleTxt, allowRepeats===true && styles.toggleTxtActive]}>Allow Repeats</Text>
                </Pressable>
              </View>
              <View style={styles.startBtn}><Text style={styles.startTxt}>START</Text></View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={paused} animationType="fade" onRequestClose={()=>setPaused(false)}>
          <View style={styles.modalBack}>
            <View style={styles.darkCard}>
              <Text style={styles.modalTitle}>Game Paused</Text>
              <Text style={styles.pauseText}>Your current code is safe. You can resume any time and keep playing from where you left off.</Text>
              <View style={{flexDirection:'row', gap:10}}>
                <Pressable style={[styles.startBtn,{flex:1}]} onPress={()=>setPaused(false)}><Text style={styles.startTxt}>RESUME</Text></Pressable>
                <Pressable style={[styles.startBtn,{flex:1}]} onPress={resetGame}><Text style={styles.startTxt}>RESTART</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={!!won} animationType="fade" onRequestClose={()=>setWon(null)}>
          <View style={styles.modalBack}>
            <View style={styles.darkCardCentered}>
              <Image source={require('../assets/confetti.png')} style={styles.confetti} resizeMode="contain" />
              <Text style={styles.modalTitle}>Code Cracked!</Text>
              <Text style={styles.winText}>
                You solved the code in {won?.attempts} guesses{won?.time ? ` (Time: ${fmt(won.time)})` : ''}.
              </Text>
              <View style={{flexDirection:'row', gap:10, width:'100%'}}>
                <Pressable style={[styles.startBtn,{flex:1}]} onPress={resetGame}><Text style={styles.startTxt}>PLAY AGAIN</Text></Pressable>
                <Pressable style={[styles.startBtn,{flex:1}]} onPress={()=>navigation.goBack()}><Text style={styles.startTxt}>HOME</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ flex:1, backgroundColor:'#0F1115' },
  bg:{ flex:1 },

  header:{
    paddingHorizontal:SIDE,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
  },
  backBtn:{
    width:BTN_H, height:BTN_H, borderRadius:14, backgroundColor:'#F6D04D',
    alignItems:'center', justifyContent:'center',
  },
  backTxt:{ color:'#1A1F2B', fontWeight:'900', fontSize: IS_SE?22:26, marginTop:-2 },

  timerPill:{
    height:BTN_H, minWidth:110, paddingHorizontal:16, borderRadius:16,
    backgroundColor:'#F6D04D', alignItems:'center', justifyContent:'center',
  },
  timerTxt:{ color:'#1A1F2B', fontWeight:'900', letterSpacing:0.5 },

  headerBtns:{ flexDirection:'row', gap:10 },
  hIcon:{
    width:BTN_H, height:BTN_H, borderRadius:12, backgroundColor:'rgba(0,0,0,0.35)',
    alignItems:'center', justifyContent:'center',
  },
  hIconTxt:{ color:'#E8ECF1', fontSize:16, fontWeight:'900' },

  slotsRow:{
    paddingHorizontal:SIDE, marginTop:12, flexDirection:'row', alignItems:'flex-start', gap:10,
  },
  slotWrap:{ alignItems:'center' },
  slot:{
    width:SLOT, height:SLOT, borderRadius:12, backgroundColor:'#13214A',
    borderWidth:2, borderColor:'#3557B7', alignItems:'center', justifyContent:'center',
  },
  slotGreen:{ backgroundColor:'#1E5E34', borderColor:'#2CC56A' },
  slotTxt:{ color:'#E8ECF1', fontWeight:'800', fontSize:18 },
  slotTxtOn:{ color:'#E8FFE8' },

  subCap:{
    marginTop:6, width:SLOT, height:SUBH, borderRadius:999, alignItems:'center', justifyContent:'center'
  },
  subCapBlue:{ backgroundColor:'#21408E' },
  subCapGreen:{ backgroundColor:'#2CC56A' },
  subCapTxt:{ color:'#DDE7FF', fontSize:12, fontWeight:'800' },
  subCapTxtOn:{ color:'#0F1115' },

  attemptPill:{
    marginLeft:'auto', height:BTN_H-4, paddingHorizontal:12, borderRadius:14,
    backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center'
  },
  attemptTxt:{ color:'#E8ECF1', fontWeight:'700', fontSize:12 },

  sectionTitleWrap:{ paddingHorizontal:SIDE, marginTop:10 },
  sectionTitle:{ color:'#E8ECF1', fontSize:14, fontWeight:'700' },

  currentRow:{ paddingHorizontal:SIDE, marginTop:6, marginBottom:10, flexDirection:'row', gap:10 },
  currentCell:{
    width:CELL, height:CELL, borderRadius:10, backgroundColor:'#A3282F',
    alignItems:'center', justifyContent:'center',
  },
  currentCellTxt:{ color:'#fff', fontSize:18, fontWeight:'900' },

  submitBtn:{
    marginHorizontal:SIDE, height:BTN_H, borderRadius:14, backgroundColor:'#F6D04D',
    alignItems:'center', justifyContent:'center', marginBottom:8,
  },
  submitTxt:{ color:'#1A1F2B', fontSize: IS_SE?14:15, fontWeight:'900', letterSpacing:0.5 },

  historyWrap:{ flex:1, paddingHorizontal:SIDE, paddingTop:6 },
  historyItem:{
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingVertical:6, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:'rgba(255,255,255,0.08)',
  },
  hGuess:{ color:'#E8ECF1', fontSize:16, fontWeight:'800' },
  hFeedback:{ flexDirection:'row', alignItems:'center', gap:8 },
  fbDot:{ width:12, height:12, borderRadius:6 },
  fbGreen:{ backgroundColor:'#2CC56A' },
  fbYellow:{ backgroundColor:'#F6D04D' },
  fbTxt:{ color:'#E8ECF1', fontWeight:'700' },

  keypad:{
    paddingHorizontal:SIDE, paddingTop:8, flexDirection:'row', flexWrap:'wrap', gap:10,
  },
  key:{
    width:(W - SIDE*2 - 10*2)/3, height:BTN_H, borderRadius:12,
    backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center',
  },
  keyOk:{ backgroundColor:'#5B8CFF' },
  keyTxt:{ color:'#E8ECF1', fontSize:18, fontWeight:'800' },
  keyOkTxt:{ color:'#fff' },

  modalBack:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding:16 },

  darkCard:{ width:'100%', borderRadius:16, backgroundColor:'#0E1C4A', padding:16, gap:12 },
  darkCardCentered:{ width:'100%', borderRadius:16, backgroundColor:'#0E1C4A', padding:16, gap:12, alignItems:'center' },

  modalTitle:{ color:'#E8ECF1', fontSize:18, fontWeight:'900' },
  modalSub:{ color:'#9AA4B2', fontSize:13 },

  toggleRow:{ flexDirection:'row', gap:10 },
  toggleBtn:{
    flex:1, height:BTN_H, borderRadius:12, backgroundColor:'rgba(0,0,0,0.35)',
    alignItems:'center', justifyContent:'center',
  },
  toggleActive:{ backgroundColor:'#F6D04D' },
  toggleTxt:{ color:'#E8ECF1', fontWeight:'800' },
  toggleTxtActive:{ color:'#1A1F2B' },

  startBtn:{ height:BTN_H, borderRadius:12, backgroundColor:'#5B8CFF', alignItems:'center', justifyContent:'center', paddingHorizontal:12 },
  startTxt:{ color:'#fff', fontSize:15, fontWeight:'900', letterSpacing:0.3 },

  pauseText:{ color:'#E8ECF1', fontSize:14, lineHeight:20 },
  winText:{ color:'#E8ECF1', fontSize:16, textAlign:'center' },

  confetti:{ width:120, height:120, marginBottom:6 },
});
