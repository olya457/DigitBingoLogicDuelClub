import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rules'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;      
const IS_SE    = H <= 667 || W <= 320;  

export default function RulesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const aOpacity = useRef(new Animated.Value(0)).current;
  const aShift   = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(aOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aShift, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [aOpacity, aShift]);

  const BACK_SIZE  = IS_SE ? 46 : IS_SMALL ? 50 : 54;
  const PILL_H     = IS_SE ? 46 : IS_SMALL ? 50 : 54;
  const PILL_FS    = IS_SE ? 15 : IS_SMALL ? 16 : 18;
  const PAR_FS     = IS_SE ? 15 : IS_SMALL ? 16 : 18;
  const PAR_LH     = IS_SE ? 21 : IS_SMALL ? 23 : 26;
  const SIDE_PAD   = IS_SE ? 16 : 20;

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: SIDE_PAD,
            paddingTop: (insets.top || 0) + 8 + 30, 
            paddingBottom: IS_SE ? 8 : 12,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { width: BACK_SIZE, height: BACK_SIZE }]}
        >
          <Text style={[styles.backTxt, { fontSize: IS_SE ? 24 : 28 }]}>‹</Text>
        </Pressable>

        <View style={[styles.titlePill, { height: PILL_H }]}>
          <Text style={[styles.titlePillTxt, { fontSize: PILL_FS }]}>RULES</Text>
        </View>
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: aOpacity,
          transform: [{ translateY: aShift }],
          marginTop: 40,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SIDE_PAD + 4,
            paddingBottom: (insets.bottom || 0) + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.p, { fontSize: PAR_FS, lineHeight: PAR_LH, marginTop: 12 }]}>
            In every round, there is a secret four-digit code. Your task is to
            discover this code in as few guesses as possible. After each guess,
            you receive feedback about which digits fit and how well they match
            the secret code.
          </Text>

          <Text style={[styles.p, { fontSize: PAR_FS, lineHeight: PAR_LH }]}>
            In Friend Duel Mode, your friend chooses a secret number
            independently—on their own device, on paper, or simply in their head.
            You use Digit Bingo Logic Duel as your logic board. You enter each
            guess into the app. After every guess, your friend tells you which
            digits are correct. You then mark their feedback.
          </Text>
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backBtn: {
    borderRadius: 14,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: {
    color: '#1A1F2B',
    fontWeight: '900',
    marginTop: -2,
  },

  titlePill: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#F6D04D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  titlePillTxt: {
    color: '#1A1F2B',
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  p: {
    color: '#E8ECF1',
    marginBottom: 18,
  },
});
