import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetPlanner } from '../../components/BudgetPlanner';
import {
  ActivityList,
  BellButton,
  Card,
  ProgressRow,
  SectionTitle,
  Segmented,
} from '../../components/parts';
import { colors } from '../../constants/colors';
import { activities, fundStats, naira } from '../../constants/data';

const SEGMENTS = ['Graduation Fund', 'Budgets', 'Goals'] as const;
type Segment = (typeof SEGMENTS)[number];

export default function Money() {
  const [segment, setSegment] = useState<Segment>('Graduation Fund');
  const [showBudget, setShowBudget] = useState(false);
  const s = fundStats();

  // Android back button closes the Budget Planner
  useEffect(() => {
    if (!showBudget) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowBudget(false);
      return true;
    });
    return () => sub.remove();
  }, [showBudget]);

  if (showBudget) return <BudgetPlanner onBack={() => setShowBudget(false)} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.title}>My Money</Text>
          <BellButton />
        </View>

        <View style={{ marginTop: 14 }}>
          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
        </View>

        {segment === 'Graduation Fund' ? (
          <>
            {/* Fund card */}
            <Card style={{ marginTop: 14 }}>
              <View style={styles.fundHead}>
                <View style={styles.fundIcon}>
                  <Ionicons name="school-outline" size={15} color={colors.dark} />
                </View>
                <Text style={styles.fundTitle}>Graduation Fund</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amount}>{naira(s.saved)}</Text>
                <Text style={styles.amountOf}> / {naira(s.goal)}</Text>
              </View>
              <ProgressRow percent={s.percent} />
              <Text style={styles.small}>
                Next milestone: {s.next ? naira(s.next.amount) : 'Goal reached'}
              </Text>
              <Text style={[styles.small, { marginTop: 4 }]}>Monthly plan: {naira(s.monthlyPlan)}</Text>
              <Pressable style={styles.planBtn} onPress={() => setShowBudget(true)} accessibilityRole="button">
                <Text style={styles.planBtnText}>View Savings Plan</Text>
              </Pressable>
            </Card>

            {/* Milestones */}
            <SectionTitle>Savings Milestones</SectionTitle>
            <Card style={{ paddingVertical: 4 }}>
              {s.milestones.map((m, i) => (
                <View key={m.percent} style={[styles.msRow, i > 0 && styles.divider]}>
                  {m.reached ? (
                    <View style={styles.msDone}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  ) : (
                    <View style={styles.msTodo} />
                  )}
                  <Text style={styles.msAmount}>{naira(m.amount)}</Text>
                  <Text style={styles.msPercent}>{m.percent}%</Text>
                </View>
              ))}
            </Card>

            {/* Recent activity */}
            <SectionTitle>Recent Activity</SectionTitle>
            <ActivityList items={activities} />
          </>
        ) : (
          <Card style={styles.soon}>
            <Text style={styles.soonText}>{segment} is coming soon</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },

  fundHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fundIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  amount: { fontSize: 24, fontWeight: '800', color: colors.ink },
  amountOf: { fontSize: 12, color: colors.muted, marginBottom: 3 },
  small: { fontSize: 11, color: colors.muted, marginTop: 10 },
  planBtn: {
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  planBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },

  msRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 6 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  msDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msTodo: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line },
  msAmount: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  msPercent: { fontSize: 11, color: colors.muted },

  soon: { marginTop: 14, alignItems: 'center', paddingVertical: 40 },
  soonText: { fontSize: 15, color: colors.muted },
});