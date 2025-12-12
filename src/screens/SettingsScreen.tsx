import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Share,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { clearRecords } from '../storage/records';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;
const IS_SE = H <= 667 || W <= 320;

const BTN_H = IS_SE ? 44 : IS_SMALL ? 48 : 52;
const ROW_H = IS_SE ? 50 : 56;
const fs = (n: number) => (IS_SE ? n - 2 : IS_SMALL ? n - 1 : n);

const VIBRO_KEY = 'settings_vibration_enabled_v1';

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [vibration, setVibration] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(VIBRO_KEY);
      if (saved != null) setVibration(saved === '1');
    })();
  }, []);

  const toggleVibration = async () => {
    const next = !vibration;
    setVibration(next);
    await AsyncStorage.setItem(VIBRO_KEY, next ? '1' : '0');
  };

  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Try Digit Bingo Logic Duel Club — a quick logical challenge!',
      });
    } catch {}
  };

  const onClear = async () => {
    Alert.alert('Clear Records', 'Delete all saved results?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearRecords();
          Alert.alert('Done', 'All records were removed.');
        },
      },
    ]);
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View
        style={[
          styles.header,
          { paddingTop: (insets.top || 0) + 8 + 16 },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>

        <View style={styles.titlePill}>
          <Text style={styles.titleTxt}>SETTINGS</Text>
        </View>

        <View style={{ width: BTN_H }} />
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: a,
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <View style={styles.listWrap}>
          <Pressable onPress={shareApp} style={styles.row}>
            <Text style={styles.rowTxt}>Share App</Text>
            <View style={styles.rowIconWrap}>
              <Text style={styles.rowIcon}>📤</Text>
            </View>
          </Pressable>

          <Pressable onPress={toggleVibration} style={styles.row}>
            <Text style={styles.rowTxt}>Vibration</Text>
            <View
              style={[
                styles.switchWrap,
                vibration ? styles.switchOn : styles.switchOff,
              ]}
            >
              <Text
                style={[
                  styles.switchTxt,
                  vibration ? styles.switchTxtOn : styles.switchTxtOff,
                ]}
              >
                {vibration ? 'ON' : 'OFF'}
              </Text>
            </View>
          </Pressable>

          <Row title="Clear Records" icon="🗑" onPress={onClear} danger />
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

function Row({
  title,
  onPress,
  icon,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  icon: string;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.rowTxt, danger && { color: '#FFD1D1' }]}>{title}</Text>
      <View
        style={[
          styles.rowIconWrap,
          danger && { backgroundColor: '#E45757' },
        ]}
      >
        <Text style={styles.rowIcon}>{icon}</Text>
      </View>
    </Pressable>
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

  backTxt: {
    color: '#1A1F2B',
    fontWeight: '900',
    fontSize: fs(26),
    marginTop: -2,
  },

  titlePill: {
    flex: 1,
    height: BTN_H,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleTxt: {
    color: '#1A1F2B',
    fontWeight: '900',
    letterSpacing: 0.5,
    fontSize: fs(16),
  },

  listWrap: {
    paddingHorizontal: 16,
    paddingTop: 40,
    gap: 10,
  },

  row: {
    height: ROW_H,
    borderRadius: 14,
    backgroundColor: '#152B6A',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowTxt: {
    color: '#E8ECF1',
    fontSize: fs(14),
    fontWeight: '700',
  },

  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowIcon: {
    color: '#1A1F2B',
    fontSize: fs(16),
    fontWeight: '900',
  },

  switchWrap: {
    minWidth: 64,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  switchOn: { backgroundColor: '#2CC56A' },
  switchOff: { backgroundColor: '#415B9A' },

  switchTxt: { fontSize: fs(12), fontWeight: '900' },
  switchTxtOn: { color: '#0F1115' },
  switchTxtOff: { color: '#E8ECF1' },
});
