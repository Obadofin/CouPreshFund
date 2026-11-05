import { Book, Briefcase, Flame, LucideIcon, Target } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import { growth } from '../constants/growth';
import { Bar, Header, IconBox } from './growthUi';
import { Card, SectionTitle } from './parts';

const STAT_ICON: Record<string, LucideIcon> = {
  lessons: Book,
  projects: Briefcase,
  weekly: Target,
  streak: Flame,
};

function Ring({ percent }: { percent: number }) {
  const size = 150;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(1, Math.max(0, percent / 100));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#D3E9DD" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${c}`}
        />
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.xp}>{growth.xp}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </View>
  );
}

export function GrowthProgress({ onBack }: { onBack: () => void }) {
  const percent = (growth.xp / growth.nextLevelXp) * 100;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="My Growth Progress" onBack={onBack} />

        <View style={styles.ringWrap}>
          <Ring percent={percent} />
          <Text style={styles.level}>
            Level {growth.level} – {growth.levelName}
          </Text>
          <Text style={styles.next}>Next level: {growth.nextLevelXp} XP</Text>
        </View>

        <SectionTitle>Your Progress</SectionTitle>
        <Card style={{ paddingVertical: 16 }}>
          {growth.stats.map((s, i) => {
            const value = s.suffix ? `${s.value}${s.suffix}` : `${s.value}/${s.goal}`;
            return (
              <View key={s.id} style={[styles.row, i > 0 && { marginTop: 14 }]}>
                <IconBox Icon={STAT_ICON[s.id] ?? Target} size={36} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.label}>{s.label}</Text>
                    <Text style={styles.value}>{value}</Text>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    <Bar percent={(s.value / s.goal) * 100} />
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  ringWrap: { alignItems: 'center', marginTop: 14 },
  ringCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  xp: { fontSize: 34, fontWeight: '800', color: colors.ink },
  xpLabel: { fontSize: 13, fontWeight: '700', color: colors.brand, marginTop: -2 },
  level: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 10 },
  next: { fontSize: 11, color: colors.muted, marginTop: 3 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: '600', color: colors.ink },
  value: { fontSize: 11, color: colors.muted },
});