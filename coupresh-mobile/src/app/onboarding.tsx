import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AuthButton } from '../components/auth';
import { colors } from '../constants/colors';

const slides = [
  {
    title: 'Your future starts here',
    text: 'Build your savings, gain valuable skills, and get ready for life after university.',
  },
  // PLACEHOLDER copy for slides 2 and 3, written from the PRD. Replace with the designer's text.
  {
    title: 'Learn as you save',
    text: 'Short lessons unlock as you reach savings milestones, so your money skills grow with your balance.',
  },
  {
    title: 'Graduate with a plan',
    text: 'Set your graduation goal, track your progress, and launch your next chapter with capital and confidence.',
  },
];

// Drawn in code so it stays sharp on every phone. Swap for the designer's image later.
function Illustration({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.art, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 288 311" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D6F0E3" />
            <Stop offset="1" stopColor="#8FD7B5" />
          </LinearGradient>
        </Defs>
        <Rect width="288" height="311" fill="url(#sky)" />

        {/* buildings */}
        <Rect x="21" y="87" width="44" height="187" rx="5" fill="#FFFFFF" opacity="0.45" />
        <Rect x="72" y="58" width="36" height="217" rx="5" fill="#FFFFFF" opacity="0.45" />
        <Rect x="217" y="101" width="51" height="173" rx="5" fill="#FFFFFF" opacity="0.45" />

        {/* dots */}
        <Circle cx="54" cy="68" r="3.5" fill="#5B3FD0" />
        <Circle cx="236" cy="63" r="5.5" fill="#F5B820" />

        {/* hill */}
        <Ellipse cx="144" cy="387" rx="200" ry="131" fill="#30C96F" />

        {/* student */}
        <Path d="M100 311 V248 A43.5 43.5 0 0 1 187 248 V311 Z" fill="#22C55E" />
        <Circle cx="144" cy="185" r="24" fill="#6E4128" />
        <Rect x="120" y="158" width="48" height="24" rx="11" fill="#0B3D2A" />

        {/* graduation cap icon */}
        <G
          transform="translate(129 126) scale(1.1667)"
          fill="none"
          stroke="#6D3FD0"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <Path d="M12 5 L22 10 L12 15 L2 10 Z" />
          <Path d="M6 12.5 V16.5 C6 18.2 8.7 19.5 12 19.5 C15.3 19.5 18 18.2 18 16.5 V12.5" />
          <Path d="M22 10 V16" />
        </G>
      </Svg>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  // The picture keeps the Figma proportions and never takes more than 46% of the screen height
  const cardWidth = width - 32;
  const cardHeight = Math.min(cardWidth * 1.08, height * 0.46);
  const titleSize = Math.min(26, Math.round(width * 0.066));

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.skipRow}>
        <Pressable onPress={() => router.replace('/register')} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
      >
        {slides.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <Illustration width={cardWidth} height={cardHeight} />
            <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.25 }]}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View key={s.title} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>

      <View style={styles.bottom}>
        <AuthButton title="Get Started" onPress={() => router.push('/register')} />
        <Pressable onPress={() => router.push('/login')} hitSlop={8} style={styles.have}>
          <Text style={styles.haveText}>I already have an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  skip: { fontSize: 12, color: colors.muted },

  pager: { flex: 1 },
  slide: { paddingHorizontal: 16 },
  art: { borderRadius: 20, overflow: 'hidden' },
  title: { fontWeight: '800', color: colors.ink, marginTop: 20 },
  text: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 8 },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginBottom: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D5E0DA' },
  dotOn: { width: 20, backgroundColor: colors.primary },

  bottom: { paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  have: { alignSelf: 'center' },
  haveText: { fontSize: 12, color: colors.muted },
});