import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getRecords, clearRecords, RecordEntry } from '../storage/records';

type Props = NativeStackScreenProps<RootStackParamList, 'Records'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;
const IS_SE = H <= 667 || W <= 320;

const BTN_H = IS_SE ? 44 : IS_SMALL ? 48 : 52;
const fs = (n: number) => (IS_SE ? n - 2 : IS_SMALL ? n - 1 : n);

const fmt = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

const AVATAR_SIZE = (IS_SE ? 160 : 200) + 40;
const EMPTY_TOP_OFFSET = 40;
const CARD_EXTRA_HEIGHT = 60;

export default function RecordsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<RecordEntry[]>([]);

  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    (async () => setItems(await getRecords()))();
  }, []);

  const renderCard = ({ item, index }: { item: RecordEntry; index: number }) => (
    <View style={styles.cardWrap}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{index + 1}</Text>
        </View>

        <Text style={styles.label}>Mode:</Text>
        <Text style={styles.value}>{item.mode === 'solo' ? 'Solo' : 'Friend Duel'}</Text>

        <Text style={[styles.label, { marginTop: 6 }]}>Tries:</Text>
        <Text style={styles.value}>{item.tries}</Text>

        <Text style={[styles.label, { marginTop: 6 }]}>Time:</Text>
        <Text style={styles.value}>{fmt(item.timeSec)}</Text>
      </View>
    </View>
  );

  return (
    <ImageBackground source={require('../assets/background.png')} style={{ flex: 1 }} resizeMode="cover">
   
      <View style={[styles.header, { paddingTop: (insets.top || 0) + 8 + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>

        <View style={styles.titlePill}>
          <Text style={styles.titleTxt}>RECORDS</Text>
        </View>

        <View style={{ width: BTN_H }} />
      </View>

      <Animated.View
        style={{
          flex: 1,
          marginTop: 30,
          opacity: a,
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyCard, { minHeight: AVATAR_SIZE + 160 + CARD_EXTRA_HEIGHT }]}>
              <View style={{ marginTop: EMPTY_TOP_OFFSET }}>
                <Image
                  source={require('../assets/girl.png')}
                  style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.emptyText}>
                Crack your first 4-digit code to light up this board. Your time and tries will show up here after each
                round.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{
              paddingBottom: (insets.bottom || 0) + 18,
              paddingTop: 8,
            }}
            data={items}
            keyExtractor={(it) => it.id}
            numColumns={1}                    
            renderItem={renderCard}
          />
        )}
      </Animated.View>

      <Pressable
        onLongPress={async () => {
          await clearRecords();
          setItems([]);
        }}
        style={{ position: 'absolute', top: (insets.top || 0) + 10, left: 0, right: 0, height: 30 }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
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

  titlePill: {
    flex: 1,
    height: BTN_H,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTxt: { color: '#1A1F2B', fontWeight: '900', letterSpacing: 0.5, fontSize: fs(16) },

  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#0E1C4A',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#E8ECF1',
    textAlign: 'center',
    fontSize: fs(15),
    lineHeight: 22,
    marginTop: 20,
  },

  cardWrap: {
    width: '92%',
    alignSelf: 'center',
    marginBottom: 12,
  },
  card: {
    minHeight: IS_SE ? 118 : 132,
    borderRadius: 14,
    backgroundColor: '#0E1C4A',
    borderWidth: 1,
    borderColor: '#F6D04D',
    padding: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { color: '#1A1F2B', fontWeight: '900', fontSize: fs(12) },

  label: { color: '#9FB0D6', fontSize: fs(12), fontWeight: '700' },
  value: { color: '#E8ECF1', fontSize: fs(14), fontWeight: '900' },
});
