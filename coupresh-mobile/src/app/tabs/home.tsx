import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/ui';
import { colors } from '../../constants/colors';
import { getTierInfo } from '../../constants/tiers';

// Sample data. Later this will come from the backend.
const user = {
  name: 'Ada',
  initials: 'AO',
  saved: 125000,
  goal: 500000,
  points: 340,
  monthsToGraduation: 19,
  streakWeeks: 8,
  weeklyTarget: 5000,
  loggedThisWeek: 0,
};

const naira = (n: number) => '₦' + n.toLocaleString('en-US');

export default function Home() {
  const percent = Math.min(100, Math.round((user.saved / user.goal) * 100));
  const { current, next } = getTierInfo(user.saved);

  const tierText = next
    ? `Tier: ${current?.name ?? 'Getting started'} ~ ${naira(next.threshold - user.saved)} to ${next.name}`
    : `Tier: ${current?.name} ~ Top tier reached`;

  const weekSub =
    user.loggedThisWeek > 0 ? `Logged ${naira(user.loggedThisWeek)}` : 'Not logged yet';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mint header with logo (scrolls away with the page) */}
        <View style={styles.header}>
          <Logo />
        </View>

        <View style={styles.body}>
          {/* Greeting */}
          <View style={styles.greetRow}>
            <View>
              <Text style={styles.hi}>Hi, {user.name}</Text>
              <Text style={styles.onTrack}>You’re on track</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.initials}</Text>
            </View>
          </View>

          {/* Total saved card */}
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardLabel}>Total Saved</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user.points} pts</Text>
              </View>
            </View>
            <Text style={styles.amount}>{naira(user.saved)}</Text>
            <Text style={styles.goalText}>of {naira(user.goal)} goal</Text>

            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>

            <Text style={styles.tierText}>{tierText}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="school-outline" size={44} color={colors.text} />
              <Text style={styles.statBig}>{user.monthsToGraduation} months</Text>
              <Text style={styles.statSmall}>to graduation</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="flame" size={32} color="#F97316" />
              <Text style={styles.statBig}>{user.streakWeeks} weeks</Text>
              <Text style={styles.statSmall}>savings streak</Text>
            </View>
          </View>

          {/* This week */}
          <View style={styles.weekCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.weekTitle}>This week: {naira(user.weeklyTarget)}</Text>
              <Text style={styles.weekSub}>{weekSub}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.85 }]}
              onPress={() => Alert.alert('Coming soon', 'Logging savings is not built yet.')}
            >
              <Text style={styles.logBtnText}>{'Log\nNow'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mint },
  scroll: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { flexGrow: 1 },

  header: { backgroundColor: colors.mint, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 48 },
  body: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 16,
    paddingBottom: 32,
  },

  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hi: { fontSize: 20, fontWeight: '700', color: colors.text },
  onTrack: { fontSize: 14, color: colors.gray },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.brand },

  card: { backgroundColor: colors.forest, borderRadius: 16, padding: 14, marginTop: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: colors.white, fontSize: 16 },
  badge: {
    backgroundColor: '#FDF1C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 13, color: '#5B4300', fontWeight: '500' },
  amount: { color: colors.white, fontSize: 34, fontWeight: '800', marginTop: 6 },
  goalText: { color: colors.white, opacity: 0.85, fontSize: 13 },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.yellow },
  tierText: { color: colors.white, fontSize: 16, marginTop: 14, lineHeight: 22 },

  statsRow: { flexDirection: 'row', gap: 14, marginTop: 18 },
  stat: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    borderRadius: 14,
    padding: 10,
    minHeight: 104,
    justifyContent: 'flex-end',
  },
  statBig: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 4 },
  statSmall: { fontSize: 15, color: colors.gray },

  weekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E3E8E5',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  weekTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  weekSub: { fontSize: 14, color: colors.gray, marginTop: 2 },
  logBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: { color: colors.white, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});