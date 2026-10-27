import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityList, BellButton, Card, ProgressRow, SectionTitle } from '../../components/parts';
import { colors } from '../../constants/colors';
import { activities, fundStats, naira, profile } from '../../constants/data';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Sample data. Later this will come from the backend.
const stages: { label: string; sub: string; icon: IconName; good?: boolean; current?: boolean }[] = [
  { label: 'Save', sub: 'On track', icon: 'wallet-outline', good: true },
  { label: 'Learn', sub: '8/12', icon: 'book-outline' },
  { label: 'Grow', sub: '2 projects', icon: 'trending-up', current: true },
  { label: 'Graduate', sub: 'In progress', icon: 'school-outline' },
  { label: 'Launch', sub: 'Not started', icon: 'rocket-outline' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const s = fundStats();
  const current = stages.find((x) => x.current);
  const openPlan = () => router.navigate('/tabs/money');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>
              {greeting()}, {profile.firstName}
            </Text>
            <Text style={styles.helloSub}>Your future is taking shape.</Text>
          </View>
          <BellButton />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
        </View>

        {/* Journey hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Your Journey to Graduation</Text>
          <Text style={styles.heroMeta}>
            Expected: {s.graduationLabel}  •  {s.monthsLeft} {s.monthsLeft === 1 ? 'month' : 'months'} left
          </Text>
          <View style={styles.stageBadge}>
            <Text style={styles.stageBadgeText}>Current stage: {current?.label}</Text>
          </View>
          <Text style={styles.heroNext}>Next: Complete your financial readiness assessment</Text>
        </View>

        {/* Journey steps */}
        <SectionTitle>Your Journey</SectionTitle>
        <Card style={styles.journey}>
          {stages.map((st) => (
            <View key={st.label} style={styles.stage}>
              <View style={[styles.stageDot, st.current && styles.stageDotOn]}>
                <Ionicons name={st.icon} size={18} color={st.current ? colors.white : colors.dark} />
              </View>
              <Text style={styles.stageLabel}>{st.label}</Text>
              <Text style={[styles.stageSub, st.good && { color: colors.brand }]}>{st.sub}</Text>
            </View>
          ))}
        </Card>

        {/* Graduation fund */}
        <Card style={{ marginTop: 14 }}>
          <Pressable style={styles.fundHead} onPress={openPlan}>
            <Text style={styles.fundTitle}>Graduation Fund</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{naira(s.saved)}</Text>
            <Text style={styles.amountOf}> / {naira(s.goal)}</Text>
          </View>
          <ProgressRow percent={s.percent} />
          <Text style={styles.small}>
            Next milestone: {s.next ? naira(s.next.amount) : 'Goal reached'}
          </Text>
          <View style={styles.planRow}>
            <Text style={styles.planText}>Monthly saving plan: {naira(s.monthlyPlan)}</Text>
            <Pressable style={styles.viewBtn} onPress={openPlan} accessibilityRole="button">
              <Text style={styles.viewBtnText}>View Plan</Text>
            </Pressable>
          </View>
        </Card>

        {/* Recent activity */}
        <SectionTitle>Recent Activity</SectionTitle>
        <ActivityList items={activities} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hello: { fontSize: 20, fontWeight: '700', color: colors.ink },
  helloSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: colors.white },

  hero: { backgroundColor: colors.forest, borderRadius: 16, padding: 14, marginTop: 16 },
  heroTitle: { fontSize: 15, fontWeight: '700', color: colors.white },
  heroMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  stageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lime,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  stageBadgeText: { fontSize: 11, fontWeight: '700', color: '#053B22' },
  heroNext: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 12 },

  journey: { flexDirection: 'row', paddingHorizontal: 6 },
  stage: { flex: 1, alignItems: 'center' },
  stageDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotOn: { backgroundColor: colors.dark },
  stageLabel: { fontSize: 11, fontWeight: '700', color: colors.ink, marginTop: 6 },
  stageSub: { fontSize: 10, color: colors.muted, marginTop: 1 },

  fundHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fundTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
  amount: { fontSize: 24, fontWeight: '800', color: colors.ink },
  amountOf: { fontSize: 12, color: colors.muted, marginBottom: 3 },
  small: { fontSize: 11, color: colors.muted, marginTop: 10 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  planText: { fontSize: 12, fontWeight: '600', color: colors.ink, flex: 1 },
  viewBtn: { backgroundColor: colors.forest, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
});