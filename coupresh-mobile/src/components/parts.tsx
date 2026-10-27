import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Alert, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { Activity, naira } from '../constants/data';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function BellButton() {
  return (
    <Pressable
      style={styles.bell}
      hitSlop={8}
      accessibilityLabel="Notifications"
      onPress={() => Alert.alert('Coming soon', 'Notifications are not built yet.')}
    >
      <Ionicons name="notifications-outline" size={18} color={colors.ink} />
    </Pressable>
  );
}

export function ProgressRow({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.progressRow}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${p}%` }]} />
      </View>
      <Text style={styles.percent}>{percent}%</Text>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segWrap}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.seg, o === value && styles.segOn]}
          accessibilityRole="button"
        >
          <Text style={[styles.segText, o === value && styles.segTextOn]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ActivityList({ items }: { items: Activity[] }) {
  return (
    <Card style={{ paddingVertical: 4 }}>
      {items.map((a, i) => (
        <View key={a.id} style={[styles.actRow, i > 0 && styles.actDivider]}>
          <View style={styles.actIcon}>
            <Ionicons name="arrow-down" size={16} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>{a.title}</Text>
            <Text style={styles.actDate}>{a.date}</Text>
          </View>
          <Text style={styles.actAmount}>+{naira(a.amount)}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, marginTop: 20, marginBottom: 10 },

  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.brand },
  percent: { fontSize: 12, fontWeight: '700', color: colors.brand },

  segWrap: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  seg: { flex: 1, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.forest },
  segText: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  segTextOn: { color: colors.white, fontWeight: '700' },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 6 },
  actDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  actIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  actDate: { fontSize: 11, color: colors.muted, marginTop: 1 },
  actAmount: { fontSize: 13, fontWeight: '700', color: colors.brand },
});