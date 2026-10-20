import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/ui';
import { colors } from '../../constants/colors';
import { tiers } from '../../constants/tiers';

// Sample data. Later this will come from the backend.
const user = { saved: 125000, points: 340 };
const invite = { code: '48291', expiresIn: '6 days 23hrs' };

type Category = 'Budgeting' | 'Savings';
type Lesson = {
  id: number;
  title: string;
  category: Category;
  minutes: number;
  tier: string;
  done: boolean;
};

// Placeholder lessons. Real content will come from the backend.
const lessons: Lesson[] = [
  { id: 1, title: 'Budgeting on ₦30k', category: 'Budgeting', minutes: 4, tier: 'Starter', done: true },
  { id: 2, title: 'The 50/30/20 rule', category: 'Budgeting', minutes: 5, tier: 'Builder', done: true },
  { id: 3, title: 'What is a T-bill?', category: 'Savings', minutes: 6, tier: 'Accelerator', done: false },
  { id: 4, title: 'Why save before you spend', category: 'Savings', minutes: 3, tier: 'Starter', done: true },
  { id: 5, title: 'Setting a savings goal', category: 'Savings', minutes: 4, tier: 'Starter', done: true },
  { id: 6, title: 'Needs vs wants', category: 'Budgeting', minutes: 3, tier: 'Starter', done: false },
  { id: 7, title: 'Building an emergency fund', category: 'Savings', minutes: 5, tier: 'Builder', done: false },
  { id: 8, title: 'Tracking your spending', category: 'Budgeting', minutes: 4, tier: 'Builder', done: false },
  { id: 9, title: 'Understanding inflation', category: 'Savings', minutes: 5, tier: 'Grower', done: false },
  { id: 10, title: 'Fixed deposits explained', category: 'Savings', minutes: 6, tier: 'Grower', done: false },
  { id: 11, title: 'How compound interest works', category: 'Savings', minutes: 6, tier: 'Accelerator', done: false },
  { id: 12, title: 'Your first year after graduation', category: 'Budgeting', minutes: 7, tier: 'Graduate Builder', done: false },
];

const FILTERS = ['All', 'Budgeting', 'Savings'] as const;
type Filter = (typeof FILTERS)[number];

const naira = (n: number) => '₦' + n.toLocaleString('en-US');
const thresholdOf = (tierName: string) => tiers.find((t) => t.name === tierName)?.threshold ?? 0;

export default function Learn() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('All');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const doneCount = lessons.filter((l) => l.done).length;
  const percent = Math.round((doneCount / lessons.length) * 100);
  const visible = filter === 'All' ? lessons : lessons.filter((l) => l.category === filter);

  async function copyCode() {
    await Clipboard.setStringAsync(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `Join me on CoupreshFund Grad so you can follow my savings goal. Use my invite code: ${invite.code}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('Could not open WhatsApp', 'Use the Copy button and paste the code instead.')
    );
  }

  function openLesson(l: Lesson) {
    const threshold = thresholdOf(l.tier);
    if (user.saved < threshold) {
      Alert.alert('Locked', `Reach ${l.tier} (${naira(threshold)}) to unlock this lesson.`);
      return;
    }
    Alert.alert('Coming soon', 'Lesson content is not built yet.');
  }

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
          {/* Title + points */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Learn</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user.points} pts</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>
              {doneCount} of {lessons.length} lessons done
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chips}
            contentContainerStyle={styles.chipsContent}
          >
            {FILTERS.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, filter === f && styles.chipOn]}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Lessons */}
          <View style={styles.list}>
            {visible.map((l) => {
              const threshold = thresholdOf(l.tier);
              const locked = user.saved < threshold;
              return (
                <Pressable
                  key={l.id}
                  style={[styles.lesson, locked && styles.lessonLocked]}
                  onPress={() => openLesson(l)}
                  accessibilityRole="button"
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lessonTitle}>{l.title}</Text>
                    <Text style={styles.lessonMeta}>
                      {locked ? `Unlocks at ${naira(threshold)}` : `${l.minutes} min ~ ${l.tier}`}
                    </Text>
                  </View>
                  {l.done ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.brand} />
                  ) : locked ? (
                    <Ionicons name="lock-closed" size={18} color={colors.placeholder} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Invite button */}
          <Pressable
            style={styles.inviteBtn}
            onPress={() => setInviteOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.inviteBtnText}>Allow others to join</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Invite a parent or guardian (slide-up sheet) */}
      <Modal
        visible={inviteOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setInviteOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>Invite a parent or guardian</Text>
              <Pressable onPress={() => setInviteOpen(false)} hitSlop={12} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.sheetDesc}>
              Share this code so they can see your progress and support your goal.
            </Text>

            <View style={styles.codeRow}>
              {invite.code.split('').map((digit, i) => (
                <View key={i} style={styles.digit}>
                  <Text style={styles.digitText}>{digit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.expires}>Expires in {invite.expiresIn}</Text>

            <View style={styles.actions}>
              <Pressable style={styles.copyBtn} onPress={copyCode} accessibilityRole="button">
                <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
              <Pressable style={styles.waBtn} onPress={shareWhatsApp} accessibilityRole="button">
                <Text style={styles.waText}>WhatsApp</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: '#FDF1C7', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 13, color: '#5B4300', fontWeight: '500' },

  progressCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
  },
  progressText: { fontSize: 17, color: colors.text },
  track: { height: 12, borderRadius: 6, backgroundColor: '#A6E4CB', marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.brand },

  chips: { marginTop: 18, flexGrow: 0 },
  chipsContent: { gap: 12 },
  chip: {
    height: 30,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: '#D2E7DC',
    borderWidth: 1,
    borderColor: '#8DB8A2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: '#A6E4CB', borderColor: colors.brand },
  chipText: { fontSize: 15, color: colors.text },
  chipTextOn: { fontWeight: '700' },

  list: { marginTop: 20, gap: 14 },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lessonLocked: { opacity: 0.75 },
  lessonTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  lessonMeta: { fontSize: 16, color: colors.gray, marginTop: 1 },

  inviteBtn: {
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  inviteBtnText: { fontSize: 20, fontWeight: '600', color: colors.text },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1 },
  sheetDesc: { fontSize: 15, color: colors.gray, marginTop: 12, lineHeight: 20 },

  codeRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  digit: {
    flex: 1,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#A6E4CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: { fontSize: 34, fontWeight: '700', color: colors.text },
  expires: { fontSize: 17, color: colors.gray, marginTop: 14 },

  actions: { flexDirection: 'row', gap: 14, marginTop: 28 },
  copyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyText: { fontSize: 20, color: colors.brand, fontWeight: '500' },
  waBtn: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waText: { fontSize: 20, color: colors.white, fontWeight: '500' },
});