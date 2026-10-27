import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fundStats, naira } from '../constants/data';
import { Card, ProgressRow, SectionTitle, Segmented } from './parts';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PERIODS = ['Monthly', 'Weekly', 'Yearly'] as const;
type Period = (typeof PERIODS)[number];
// Sample scaling from the monthly figures. To be confirmed with the designer.
const FACTOR: Record<Period, number> = { Monthly: 1, Weekly: 0.25, Yearly: 12 };

// Sample data. Later this will come from the backend.
const budget = { total: 80000, cap: 500000 };
const breakdown = [
  { label: 'Essentials', pct: 50, color: colors.dark },
  { label: 'Learning', pct: 20, color: colors.purple },
  { label: 'Transport', pct: 15, color: colors.lime },
  { label: 'Other', pct: 15, color: colors.amber },
];
const lessons: { title: string; meta: string; icon: IconName; bg: string; fg: string }[] = [
  { title: 'Budgeting Basics', meta: '7 min • Financial Literacy', icon: 'book-outline', bg: colors.purpleTint, fg: colors.purple },
  { title: 'Saving vs Investing', meta: '5 min • Financial Literacy', icon: 'trending-up', bg: colors.tint, fg: colors.brand },
];

const shortNaira = (n: number) => '₦' + Math.round(n / 1000) + 'k';

function Donut({ label }: { label: string }) {
  const size = 104;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {breakdown.map((seg) => {
          const len = (c * seg.pct) / 100;
          const el = (
            <Circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function BudgetPlanner({ onBack }: { onBack: () => void }) {
  const [period, setPeriod] = useState<Period>('Monthly');
  const s = fundStats();

  const total = Math.round(budget.total * FACTOR[period]);
  const cap = Math.round(budget.cap * FACTOR[period]);
  const percent = Math.round((total / cap) * 100);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Budget Planner</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        </View>

        {/* Budget card */}
        <Card style={{ marginTop: 14 }}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadLeft}>
              <View style={styles.smallIcon}>
                <Ionicons name="wallet-outline" size={14} color={colors.dark} />
              </View>
              <Text style={styles.cardTitle}>Your {period} Budget</Text>
            </View>
            <Pressable
              style={styles.setPill}
              onPress={() => Alert.alert('Coming soon', 'Setting a budget is not built yet.')}
            >
              <Text style={styles.setPillText}>Set Budget</Text>
            </Pressable>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{naira(total)}</Text>
            <Text style={styles.amountOf}> / {naira(cap)}</Text>
          </View>
          <ProgressRow percent={percent} />
          <Text style={styles.small}>
            Next milestone: {s.next ? naira(s.next.amount) : 'Goal reached'}
          </Text>
          <Text style={[styles.small, { marginTop: 4 }]}>Monthly plan: {naira(s.monthlyPlan)}</Text>
        </Card>

        {/* Spending breakdown */}
        <Card style={{ marginTop: 14 }}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>
          <View style={styles.breakRow}>
            <Donut label={shortNaira(total)} />
            <View style={styles.legend}>
              {breakdown.map((seg) => (
                <View key={seg.label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <Text style={styles.legendLabel}>{seg.label}</Text>
                  <Text style={styles.legendPct}>{seg.pct}%</Text>
                  <Text style={styles.legendAmount}>{naira(Math.round((total * seg.pct) / 100))}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Popular lessons */}
        <SectionTitle>Popular Lessons</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {lessons.map((l, i) => (
            <Pressable
              key={l.title}
              style={[styles.lessonRow, i > 0 && styles.divider]}
              onPress={() => Alert.alert('Coming soon', 'Lesson content is not built yet.')}
              accessibilityRole="button"
            >
              <View style={[styles.lessonIcon, { backgroundColor: l.bg }]}>
                <Ionicons name={l.icon} size={18} color={l.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{l.title}</Text>
                <Text style={styles.lessonMeta}>{l.meta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </Card>

        {/* Tip */}
        <View style={styles.tip}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={16} color={colors.brand} />
          </View>
          <Text style={styles.tipText}>
            You’re on track! Keep your spending within budget to reach your goals faster.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '600', color: colors.ink },

  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  setPill: { backgroundColor: colors.tint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  setPillText: { fontSize: 11, fontWeight: '700', color: colors.brand },

  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  amount: { fontSize: 24, fontWeight: '800', color: colors.ink },
  amountOf: { fontSize: 12, color: colors.muted, marginBottom: 3 },
  small: { fontSize: 11, color: colors.muted, marginTop: 10 },

  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  donutCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  donutLabel: { fontSize: 14, fontWeight: '800', color: colors.ink },
  legend: { flex: 1, gap: 9 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 11, color: colors.ink },
  legendPct: { fontSize: 11, color: colors.muted, width: 32, textAlign: 'right' },
  legendAmount: { fontSize: 11, fontWeight: '700', color: colors.ink, width: 66, textAlign: 'right' },

  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  lessonIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  lessonMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },

  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.tint,
    borderWidth: 1,
    borderColor: '#CFE8DA',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: { flex: 1, fontSize: 12, color: colors.ink, lineHeight: 17 },
});