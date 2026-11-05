import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lightbulb, LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

/* ---------- Header: back arrow, title, optional button on the right ---------- */
export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <ChevronLeft size={24} color={colors.ink} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {right}
    </View>
  );
}

/* ---------- Card with a colour gradient that always fills the whole card ---------- */
export function GradientCard({
  from,
  to,
  style,
  children,
}: {
  from: string;
  to: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientCard, style]}
    >
      {children}
    </LinearGradient>
  );
}

/* ---------- Rounded square with an icon ---------- */
export function IconBox({
  Icon,
  bg = colors.tint,
  fg = colors.brand,
  size = 36,
}: {
  Icon: LucideIcon;
  bg?: string;
  fg?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size * 0.5} color={fg} strokeWidth={2} />
    </View>
  );
}

/* ---------- Thin progress bar ---------- */
export function Bar({ percent, height = 5 }: { percent: number; height?: number }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: '#DCEBE3', overflow: 'hidden' }}>
      <View
        style={{ width: `${p}%`, height: '100%', borderRadius: height / 2, backgroundColor: colors.brand }}
      />
    </View>
  );
}

/* ---------- Purple "Featured" challenge banner ---------- */
export function ChallengeBanner({ title, onPress }: { title: string; onPress?: () => void }) {
  const banner = (
    <GradientCard from="#6D3FD0" to="#5732C0" style={styles.banner}>
      <View style={{ flex: 1 }}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Featured</Text>
        </View>
        <Text style={styles.bannerTitle}>{title}</Text>
      </View>
      <View style={styles.bulb}>
        <Lightbulb size={26} color={colors.amber} strokeWidth={2} />
      </View>
    </GradientCard>
  );

  if (!onPress) return banner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {banner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },

  gradientCard: { borderRadius: 16, overflow: 'hidden' },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 136 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.purple },
  bannerTitle: { fontSize: 19, fontWeight: '800', color: colors.white, lineHeight: 24, marginTop: 10 },
  bulb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});