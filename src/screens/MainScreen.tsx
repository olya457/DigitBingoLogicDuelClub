import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;
const PADDING_H = 20;
const LOGO_H = IS_SMALL ? 210 : 280;
const BTN_FONT = IS_SMALL ? 14 : 16;
const BTN_PAD_V = IS_SMALL ? 12 : 14;
const ICON_SIZE = IS_SMALL ? 40 : 44;

const Btn = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable style={styles.btn} onPress={onPress}>
    <Text style={[styles.btnTxt, { fontSize: BTN_FONT }]}>{title}</Text>
  </Pressable>
);

export default function MainScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(12)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslate, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(listTranslate, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoOpacity, logoTranslate, listOpacity, listTranslate]);

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (insets.top || 0) + 60,
            paddingBottom: (insets.bottom || 0) + 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
      
        <View style={styles.topIcons}>
          <Pressable
            onPress={() => navigation.navigate('Rules')}
            style={[styles.iconBtn, { width: ICON_SIZE, height: ICON_SIZE }]}
          >
            <Text style={styles.iconTxt}>?</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={[styles.iconBtn, { width: ICON_SIZE, height: ICON_SIZE }]}
          >
            <Text style={styles.iconTxt}>⚙️</Text>
          </Pressable>
        </View>

        <Animated.View
          style={{
            width: '100%',
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslate }],
          }}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={{
            width: '100%',
            opacity: listOpacity,
            transform: [{ translateY: listTranslate }],
          }}
        >
          <View style={styles.btns}>
            <Btn
              title="SOLO LOGIC RUN"
              onPress={() => navigation.navigate('SoloLogicRun')}
            />
            <Btn
              title="FRIEND DUEL MODE"
              onPress={() => navigation.navigate('FriendDuelMode')}
            />
            <Btn title="RECORDS" onPress={() => navigation.navigate('Records')} />
          </View>
        </Animated.View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  content: {
    paddingHorizontal: PADDING_H,
    alignItems: 'center',
  },

  topIcons: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTxt: {
    color: '#E8ECF1',
    fontSize: 18,
    fontWeight: '900',
  },

  logo: {
    width: '100%',
    height: LOGO_H,
    marginBottom: 20,
  },

  btns: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    backgroundColor: '#F6D04D',
    borderRadius: 16,
    paddingVertical: BTN_PAD_V,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  btnTxt: {
    color: '#1A1F2B',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
