import { useRouter } from 'expo-router';
import {
  Book,
  ChevronRight,
  Coins,
  EllipsisVertical,
  LucideIcon,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GrowthChallenge } from '../../components/GrowthChallenge';
import { GrowthProgress } from '../../components/GrowthProgress';
import { GrowthSkills } from '../../components/GrowthSkills';
import { ChallengeBanner, GradientCard, Header, IconBox } from '../../components/growthUi';
import { Card, ProgressRow, SectionTitle, Segmented } from '../../components/parts';
import { colors } from '../../constants/colors';
import { challenge, hub, LessonKind } from '../../constants/growth';

const SEGMENTS = ['Lessons', 'Challenges', 'Library'] as const;
type Segment = (typeof SEGMENTS)[number];
type Screen = 'hub' | 'challenge' | 'progress' | 'skills';

const LESSON_STYLE: Record<LessonKind, { Icon: LucideIcon; bg: string; fg: string }> = {
  invest: { Icon: TrendingUp, bg: colors.purpleTint, fg: colors.purple },
  interest: { Icon: Coins, bg: colors.tint, fg: colors.brand },
  budget: { Icon: Wallet, bg: '#FDF1D6', fg: '#D98A00' },
  rule: { Icon: Target, bg: '#E4ECFB', fg: '#3B63D6' },
};

const soon = () => Alert.alert('Coming soon', 'Lesson content is not built yet.');

export default function Growth() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('Lessons');
  // A small history so Back returns to the screen you came from
  const [stack, setStack] = useState<Screen[]>(['hub']);
  const screen = stack[stack.length - 1];

  const push = (s: Screen) => setStack((st) => [...st, s]);
  const pop = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));

  // Android back button goes back inside this tab first
  useEffect(() => {
    if (stack.length === 1) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      pop();
      return true;
    });
    return () => sub.remove();
  }, [stack.length]);

  if (screen === 'challenge') return <GrowthChallenge onBack={pop} onStart={() => push('progress')} />;
  if (screen === 'progress') return <GrowthProgress onBack={pop} />;
  if (screen === 'skills') return <GrowthSkills onBack={pop} />;

  const openMenu = () =>
    Alert.alert('Learning Hub', undefined, [
      { text: 'My Growth Progress', onPress: () => push('progress') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  // Library opens its own screen (Skills & Entrepreneurship) instead of switching the list
  const onSegment = (s: Segment) => (s === 'Library' ? push('skills') : setSegment(s));

  const { continueLearning, popularLessons } = hub;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Learning Hub"
          onBack={() => router.navigate('/tabs/home')}
          right={
            <Pressable onPress={openMenu} hitSlop={12} accessibilityLabel="More options">
              <EllipsisVertical size={20} color={colors.ink} />
            </Pressable>
          }
        />

        <View style={{ marginTop: 12 }}>
          <Segmented options={SEGMENTS} value={segment} onChange={onSegment} />
        </View>

        {segment === 'Lessons' && (
          <>
            <GradientCard from="#0B5233" to="#1C8F59" style={styles.hero}>
              <Text style={styles.heroText}>{'Learn today. Build\ntomorrow.'}</Text>
              <View style={styles.heroIcon}>
                <Book size={28} color={colors.white} strokeWidth={2} />
              </View>
            </GradientCard>

            <SectionTitle>Continue Learning</SectionTitle>
            <Pressable onPress={soon} accessibilityRole="button">
              <Card>
                <View style={styles.continueTop}>
                  <IconBox Icon={Book} size={36} />
                  <Text style={styles.continueTitle}>{continueLearning.title}</Text>
                </View>
                <ProgressRow percent={continueLearning.percent} />
                <Text style={styles.caption}>
                  {continueLearning.minutesLeft} min left • {continueLearning.category}
                </Text>
              </Card>
            </Pressable>

            <SectionTitle>Popular Lessons</SectionTitle>
            <Card style={{ paddingVertical: 4 }}>
              {popularLessons.map((l, i) => {
                const look = LESSON_STYLE[l.kind];
                return (
                  <Pressable
                    key={l.id}
                    style={[styles.lesson, i > 0 && styles.divider]}
                    onPress={soon}
                    accessibilityRole="button"
                  >
                    <IconBox Icon={look.Icon} bg={look.bg} fg={look.fg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonTitle}>{l.title}</Text>
                      <Text style={styles.lessonMeta}>{l.minutes} min</Text>
                    </View>
                    <ChevronRight size={16} color={colors.muted} />
                  </Pressable>
                );
              })}
            </Card>
          </>
        )}

        {segment === 'Challenges' && (
          <>
            <SectionTitle>Featured Challenge</SectionTitle>
            <ChallengeBanner title={challenge.title} onPress={() => push('challenge')} />
            <Text style={styles.challengeNote}>{challenge.description}</Text>
            <Text style={styles.challengeXp}>Earn {challenge.xp} XP</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 112,
    marginTop: 12,
  },
  heroText: { fontSize: 17, fontWeight: '800', color: colors.white, lineHeight: 22 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  continueTitle: { flex: 1, fontSize: 12.5, fontWeight: '600', color: colors.ink },
  caption: { fontSize: 10, color: colors.muted, marginTop: 8 },

  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  lessonTitle: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  lessonMeta: { fontSize: 10, color: colors.muted, marginTop: 2 },

  challengeNote: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 12 },
  challengeXp: { fontSize: 12, fontWeight: '700', color: colors.purple, marginTop: 8 },
});