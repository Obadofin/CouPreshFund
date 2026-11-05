import { Award, Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { challenge } from '../constants/growth';
import { ChallengeBanner, Header } from './growthUi';
import { Card } from './parts';

export function GrowthChallenge({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Challenge Details" onBack={onBack} />

        <View style={{ marginTop: 12 }}>
          <ChallengeBanner title={challenge.title} />
        </View>

        <Text style={styles.desc}>{challenge.description}</Text>

        <Card style={{ paddingVertical: 2 }}>
          {challenge.steps.map((s, i) => (
            <View key={s.id} style={[styles.step, i > 0 && styles.divider]}>
              <Text style={styles.num}>{s.id}.</Text>
              <Text style={styles.stepLabel}>{s.label}</Text>
              {s.done ? (
                <View style={styles.checkOn}>
                  <Check size={13} color={colors.white} strokeWidth={3} />
                </View>
              ) : (
                <View style={styles.checkOff} />
              )}
            </View>
          ))}
        </Card>

        <View style={styles.actions}>
          <View style={styles.xp}>
            <Award size={16} color={colors.purple} strokeWidth={2} />
            <Text style={styles.xpText}>{challenge.xp} XP</Text>
          </View>
          <Pressable style={styles.start} onPress={onStart} accessibilityRole="button">
            <Text style={styles.startText}>Start Challenge</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },

  desc: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 14, marginBottom: 14 },

  step: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  num: { width: 18, fontSize: 11, color: colors.muted },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.ink },
  checkOn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CBD6D0' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  xp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.purpleTint,
  },
  xpText: { fontSize: 12, fontWeight: '700', color: colors.purple },
  start: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { fontSize: 13, fontWeight: '700', color: colors.white },
});