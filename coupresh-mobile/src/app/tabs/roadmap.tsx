import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/ui';
import { colors } from '../../constants/colors';
import { getTierInfo, tiers } from '../../constants/tiers';

// Sample data. Later this will come from the backend.
const user = {
  saved: 125000,
  lessonsToNext: 3,
  unlockedOn: { Starter: '12 Mar', Builder: '30 May' } as Record<string, string>,
};

const tierNotes: Record<string, string> = {
  'Graduate Builder': 'Your goal line',
};

const naira = (n: number) => '₦' + n.toLocaleString('en-US');

export default function Roadmap() {
  const router = useRouter();
  const { current, next } = getTierInfo(user.saved);

  const percent = next ? Math.min(100, Math.round((user.saved / next.threshold) * 100)) : 100;

  let subtitle = '';
  if (next && current) subtitle = `You’re a ${current.name} ~ ${percent}% to ${next.name}`;
  else if (next) subtitle = `${percent}% to ${next.name}`;
  else subtitle = `You’re a ${current?.name} ~ top tier reached`;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mint header: logo + back arrow */}
        <View style={styles.header}>
          <Logo />
          <Pressable
            onPress={() => router.navigate('/tabs/home')}
            hitSlop={12}
            style={styles.back}
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Your roadmap</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Progress to next tier */}
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>

          {/* Tier list */}
          <View style={styles.list}>
            {tiers.map((t) => {
              const unlocked = user.saved >= t.threshold;
              const isNext = next?.name === t.name;

              let sub: string | null = null;
              if (unlocked) {
                sub = user.unlockedOn[t.name] ? `Unlocked ${user.unlockedOn[t.name]}` : null;
              } else if (isNext) {
                sub = `${naira(t.threshold - user.saved)} to go - ${user.lessonsToNext} lessons`;
              } else {
                sub = tierNotes[t.name] ?? null;
              }

              const showPreview = unlocked && t.name === 'Grower';

              return (
                <View key={t.name} style={styles.row}>
                  <View style={[styles.dot, unlocked ? styles.dotDone : styles.dotLocked]}>
                    {unlocked && <Ionicons name="checkmark-done" size={22} color={colors.white} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierName}>
                      {t.name} ~ {naira(t.threshold)}
                    </Text>
                    {showPreview && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>Growth Unlock preview</Text>
                      </View>
                    )}
                    {sub && <Text style={styles.tierSub}>{sub}</Text>}
                  </View>
                </View>
              );
            })}
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

  header: { backgroundColor: colors.mint, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 36 },
  back: { marginTop: 12, alignSelf: 'flex-start' },

  body: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 16,
    paddingBottom: 32,
  },

  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: 14, color: colors.gray, marginTop: 4 },

  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A6E4CB',
    marginTop: 22,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.brand },

  list: { marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  dot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.brand },
  dotLocked: { backgroundColor: '#DADADA' },

  tierName: { fontSize: 17, fontWeight: '700', color: colors.text },
  tierSub: { fontSize: 16, color: colors.gray, marginTop: 1 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF1C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  chipText: { fontSize: 13, color: '#5B4300' },
});