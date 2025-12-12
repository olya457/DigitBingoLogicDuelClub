import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;
const IS_SE = H <= 667 || W <= 320;

const ILL_H = IS_SE
  ? Math.min(360, H * 0.46)
  : IS_SMALL
  ? Math.min(440, H * 0.50)
  : Math.min(560, H * 0.55);

const fs = (n: number) => (IS_SE ? n - 2 : IS_SMALL ? n - 1 : n);

const PAGES = [
  {
    title: 'Welcome to Digit Bingo Logic Duel Club',
    desc:
      'Every round, a secret four-digit code is created just for you. Your mission is to use logic, attention and sharp deduction to crack the code in as few steps as possible.',
    img: require('../assets/onboarding_1.png'),
  },
  {
    title: 'Solo Logic Runs',
    desc:
      'Train your brain with rapid logic tasks. Detect patterns, eliminate impossible options, make quick conclusions.',
    img: require('../assets/onboarding_2.png'),
  },
  {
    title: 'Duel a Friend',
    desc:
      'Play together on one device. Read the clues, act faster and claim victory.',
    img: require('../assets/onboarding_3.png'),
  },
  {
    title: 'Records and Progress',
    desc:
      'Track your best logic runs, milestones, streaks and overall growth over time.',
    img: require('../assets/onboarding_4.png'),
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const page = PAGES[index];

  const illOpacity = useRef(new Animated.Value(0)).current;
  const illShift = useRef(new Animated.Value(14)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(14)).current;

  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnShift = useRef(new Animated.Value(12)).current;

  const animatePage = () => {
    illOpacity.setValue(0);
    illShift.setValue(14);
    textOpacity.setValue(0);
    textShift.setValue(14);
    btnOpacity.setValue(0);
    btnShift.setValue(12);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(illOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(illShift, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textShift, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(btnShift, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  };

  useEffect(() => {
    animatePage();
  }, [index]);

  const next = () => {
    if (index < PAGES.length - 1) setIndex(i => i + 1);
    else navigation.replace('Main');
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.bg}
      resizeMode="cover"
    >

      <Animated.View
        style={[
          styles.illWrap,
          {
            opacity: illOpacity,
            transform: [{ translateY: illShift }],
          },
        ]}
      >
        <Image
          source={page.img}
          style={[styles.ill, { height: ILL_H }]}
          resizeMode="contain"
        />
      </Animated.View>


      <View style={[styles.bottom, { marginBottom: insets.bottom + 20 }]}>
        <View style={styles.card}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: textOpacity,
                transform: [{ translateY: textShift }],
                fontSize: fs(18),
              },
            ]}
          >
            {page.title}
          </Animated.Text>

          <Animated.Text
            style={[
              styles.desc,
              {
                opacity: textOpacity,
                transform: [{ translateY: textShift }],
                fontSize: fs(14),
                lineHeight: fs(20),
              },
            ]}
          >
            {page.desc}
          </Animated.Text>

          <Animated.View
            style={{
              opacity: btnOpacity,
              transform: [{ translateY: btnShift }],
            }}
          >
            <Pressable onPress={next} style={styles.cta}>
              <Text style={[styles.ctaTxt, { fontSize: fs(15) }]}>
                {index === PAGES.length - 1 ? 'START PLAYING' : 'NEXT'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  illWrap: {
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    marginTop: IS_SE ? 40 : IS_SMALL ? 60 : 90,
  },
  ill: {
    width: '100%',
  },

  bottom: {
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },

  card: {
    backgroundColor: 'rgba(15,17,21,0.92)',
    borderRadius: 18,
    padding: IS_SE ? 12 : IS_SMALL ? 14 : 16,
    gap: 10,
  },

  title: {
    color: '#E8ECF1',
    fontWeight: '800',
  },
  desc: {
    color: '#B7C1CC',
  },

  cta: {
    marginTop: 10,
    backgroundColor: '#5B8CFF',
    borderRadius: 14,
    paddingVertical: IS_SE ? 10 : 12,
    alignItems: 'center',
  },
  ctaTxt: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
