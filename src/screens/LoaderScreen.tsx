import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  ImageBackground,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 700 || W < 360;     
const IS_SE    = H <= 667 || W <= 320;    

const LOGO_W = IS_SE ? Math.min(W * 0.58, 220)
            : IS_SMALL ? Math.min(W * 0.62, 260)
            : Math.min(W * 0.68, 320);
const LOGO_H = LOGO_W; 

const GAP    = IS_SE ? 8 : IS_SMALL ? 10 : 12;
const TEXT_FS= IS_SE ? 14 : IS_SMALL ? 15 : 16;

export default function LoaderScreen({ navigation }: Props) {
  const aOpacity = useRef(new Animated.Value(0)).current;
  const aScale   = useRef(new Animated.Value(0.92)).current;
  const aShift   = useRef(new Animated.Value(10)).current;

  useEffect(() => {
  
    Animated.parallel([
      Animated.timing(aOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aScale,   { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aShift,   { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => navigation.replace('Onboarding'), 3000);
    return () => clearTimeout(t);
  }, [navigation, aOpacity, aScale, aShift]);

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.bg}
      resizeMode="cover"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Background"
    >
      <View style={[styles.center, { gap: GAP }]}>
        <Animated.Image
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            {
              width: LOGO_W,
              height: LOGO_H,
              opacity: aOpacity,
              transform: [{ scale: aScale }, { translateY: aShift }],
            },
          ]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessible
          accessibilityRole="image"
          accessibilityLabel="App logo"
        />

        <ActivityIndicator size={IS_SE ? 'small' : 'large'} color="#F6D04D" />

        <Text style={[styles.text, { fontSize: TEXT_FS }]}>
          Loading…
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16, 
  },
  logo: {
    marginBottom: 8,
  },
  text: {
    color: '#E8ECF1',
    letterSpacing: 0.3,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
});
