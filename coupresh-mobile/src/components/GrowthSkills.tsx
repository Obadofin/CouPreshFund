import { ChevronRight, Code, Coins, File, Lightbulb, LucideIcon, Target } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { PathwayKind, skills } from '../constants/growth';
import { Header, IconBox } from './growthUi';
import { Card, Segmented } from './parts';

const SEGMENTS = ['Pathways', 'My Projects'] as const;
type Segment = (typeof SEGMENTS)[number];

const LOOK: Record<PathwayKind, { Icon: LucideIcon; bg: string; fg: string }> = {
  digital: { Icon: Code, bg: colors.purpleTint, fg: colors.purple },
  entrepreneurship: { Icon: Lightbulb, bg: colors.tint, fg: colors.brand },
  finance: { Icon: Coins, bg: '#FDF1D6', fg: '#D98A00' },
  career: { Icon: File, bg: '#E4ECFB', fg: '#3B63D6' },
  personal: { Icon: Target, bg: '#FCE4F1', fg: '#C0338B' },
};

export function GrowthSkills({ onBack }: { onBack: () => void }) {
  const [segment, setSegment] = useState<Segment>('Pathways');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Skills & Entrepreneurship" onBack={onBack} />

        <View style={{ marginTop: 12 }}>
          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
        </View>

        {segment === 'Pathways' ? (
          <View style={styles.list}>
            {skills.pathways.map((p) => {
              const look = LOOK[p.kind];
              return (
                <Pressable
                  key={p.id}
                  style={styles.card}
                  onPress={() => Alert.alert('Coming soon', 'Pathway content is not built yet.')}
                  accessibilityRole="button"
                >
                  <IconBox Icon={look.Icon} bg={look.bg} fg={look.fg} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{p.title}</Text>
                    <Text style={styles.topics}>{p.topics}</Text>
                  </View>
                  <Text style={styles.count}>
                    {p.done}/{p.total}
                  </Text>
                  <ChevronRight size={16} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Card style={styles.soonCard}>
            <Text style={styles.soonText}>My Projects is coming soon</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  list: { gap: 12, marginTop: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  title: { fontSize: 13, fontWeight: '600', color: colors.ink },
  topics: { fontSize: 10, color: colors.muted, marginTop: 3 },
  count: { fontSize: 11, fontWeight: '700', color: colors.brand },

  soonCard: { marginTop: 14, alignItems: 'center', paddingVertical: 40 },
  soonText: { fontSize: 15, color: colors.muted },
});