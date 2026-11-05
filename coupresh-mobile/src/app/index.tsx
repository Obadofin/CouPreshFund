import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../components/auth';
import { colors } from '../constants/colors';

const DURATION = 2600; // how long the splash shows, in milliseconds

export default function Splash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bar = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    bar.start();
    // Go to onboarding by itself. replace() means Back won't return to the splash.
    const timer = setTimeout(() => router.replace('/onboarding'), DURATION);
    return () => {
      bar.stop();
      clearTimeout(timer);
    };
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['8%', '100%'] });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.center}>
        <BrandLogo variant="dark" width={240} />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.footText}>
          SAVE. LEARN. GROW. GRADUATE. <Text style={styles.launch}>LAUNCH.</Text>
        </Text>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.splash },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 14 },
  footText: { fontSize: 10, fontWeight: '600', color: colors.white, letterSpacing: 1 },
  launch: { color: '#8B6CF6' },
  track: {
    width: 90,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.white },
});