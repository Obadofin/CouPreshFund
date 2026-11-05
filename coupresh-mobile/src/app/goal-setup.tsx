import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Logo } from '../components/ui';
import { colors } from '../constants/colors';
import { saveGoal } from '../lib/goals';

/* ---------- Sample data and settings ---------- */
// Graduation date is sample data. It will come from the student's profile.
const GRADUATION = new Date(2028, 5, 30);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const gradLabel = `${MONTHS[GRADUATION.getMonth()]} ${GRADUATION.getFullYear()}`;

const MIN_GOAL = 10000; // same as the Starter tier
const GOAL_PRESETS = [100000, 250000, 500000];
const BODY_BG = '#E3F2EB';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const PURPOSES: { key: string; label: string; icon: IconName }[] = [
  { key: 'business', label: 'Start a business', icon: 'rocket-launch' },
  { key: 'postgrad', label: 'Post-grad', icon: 'note-plus' },
  { key: 'certifications', label: 'Certifications', icon: 'certificate' },
  { key: 'tech', label: 'Tech skills', icon: 'android' },
];

type Frequency = {
  key: 'weekly' | 'monthly' | 'custom' | 'yearly';
  label: string;
  every: string;
  days: number; // days between savings
  unit: 'week' | 'month' | 'year';
  step: number; // rounding step for the suggested amount
  chips: number[]; // quick amounts
};

const FREQUENCIES: Frequency[] = [
  { key: 'weekly', label: 'Weekly', every: 'every week', days: 7, unit: 'week', step: 500, chips: [2000, 5000, 7500] },
  { key: 'monthly', label: 'Monthly', every: 'every month', days: 30.4375, unit: 'month', step: 1000, chips: [10000, 20000, 30000] },
  // "Custom" is every 2 weeks for now. To be confirmed with the designer.
  { key: 'custom', label: 'Custom', every: 'every 2 weeks', days: 14, unit: 'week', step: 500, chips: [5000, 10000, 15000] },
  { key: 'yearly', label: 'Yearly', every: 'every year', days: 365.25, unit: 'year', step: 10000, chips: [100000, 200000, 300000] },
];

const naira = (n: number) => '₦' + n.toLocaleString('en-US');
const short = (n: number) => '₦' + n / 1000 + 'k';
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/* ---------- Small pieces ---------- */
function Chip({
  label,
  selected,
  onPress,
  tone,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone: 'grey' | 'white';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.chip, tone === 'white' ? styles.chipWhite : styles.chipGrey, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function MoneyInput({
  value,
  onChange,
  inputRef,
  outlined,
}: {
  value: string;
  onChange: (digits: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  outlined?: boolean;
}) {
  return (
    <View style={[styles.moneyBox, outlined && styles.moneyOutlined]}>
      <Text style={[styles.moneySign, outlined && { fontSize: 24 }]}>₦</Text>
      <TextInput
        ref={inputRef}
        style={[styles.moneyInput, outlined && { fontSize: 24 }]}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        value={value ? Number(value).toLocaleString('en-US') : ''}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 9))}
      />
    </View>
  );
}

/* ---------- Screen ---------- */
export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('500000');
  const [freqKey, setFreqKey] = useState<Frequency['key']>('weekly');
  const [plan, setPlan] = useState('5000');
  const [saving, setSaving] = useState(false);
  const goalRef = useRef<TextInput>(null);

  // Android back button: from step 2 go back to step 1
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 2) {
        setStep(1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const freq = FREQUENCIES.find((f) => f.key === freqKey)!;
  const goalNum = Number(goal) || 0;
  const planNum = Number(plan) || 0;

  const daysLeft = Math.max(1, Math.ceil((GRADUATION.getTime() - Date.now()) / 86400000));
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const weeklyTarget = Math.round(goalNum / weeksLeft / 100) * 100;
  const goalValid = goalNum >= MIN_GOAL;
  const canContinue = purpose !== null && goalValid;

  // Step 2 maths
  const needed = planNum > 0 ? Math.ceil(goalNum / planNum) : 0;
  const timeToReach = freq.unit === 'week' ? Math.ceil((needed * freq.days) / 7) : needed;
  const count = Math.floor(daysLeft / freq.days);
  const projected = planNum * count;
  const onTrack = projected >= goalNum;
  const suggested = Math.ceil(goalNum / Math.max(1, count) / freq.step) * freq.step;

  function goBack() {
    if (step === 2) setStep(1);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function pickFrequency(f: Frequency) {
    setFreqKey(f.key);
    setPlan(String(f.chips[1]));
  }

  async function start() {
    setSaving(true);
    try {
      await saveGoal({
        purpose: purpose ?? '',
        description: description.trim(),
        targetAmount: goalNum,
        frequency: freqKey,
        planAmount: planNum,
      });
      router.replace('/tabs/home');
    } catch {
      Alert.alert('Something went wrong', 'We could not save your plan. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mint header: logo + back arrow */}
          <View style={styles.header}>
            <Logo />
            <Pressable onPress={goBack} hitSlop={12} style={styles.back} accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={styles.stepText}>Step {step} of 2</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: step === 1 ? '50%' : '100%' }]} />
            </View>

            {step === 1 ? (
              <>
                <Text style={styles.sectionTitle}>What are you saving for?</Text>
                <View style={styles.grid}>
                  {PURPOSES.map((p) => (
                    <Pressable
                      key={p.key}
                      onPress={() => setPurpose(p.key)}
                      accessibilityRole="button"
                      style={[styles.purposeCard, purpose === p.key && styles.purposeCardOn]}
                    >
                      <MaterialCommunityIcons name={p.icon} size={34} color={colors.text} />
                      <Text style={styles.purposeText}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  style={styles.descInput}
                  placeholder="Open my fashion studio"
                  placeholderTextColor={colors.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={80}
                />

                <Text style={styles.question}>How much do you want to save?</Text>
                <MoneyInput value={goal} onChange={setGoal} inputRef={goalRef} />

                <View style={styles.chipsRow}>
                  {GOAL_PRESETS.map((n) => (
                    <Chip
                      key={n}
                      tone="grey"
                      label={short(n)}
                      selected={goalNum === n}
                      onPress={() => setGoal(String(n))}
                    />
                  ))}
                  <Chip
                    tone="grey"
                    label="Custom"
                    selected={!GOAL_PRESETS.includes(goalNum)}
                    onPress={() => {
                      setGoal('');
                      goalRef.current?.focus();
                    }}
                  />
                </View>

                <View style={styles.banner}>
                  <Text style={styles.bannerText}>
                    {goalValid
                      ? `That’s about ${naira(weeklyTarget)} per week until ${gradLabel}.`
                      : `Enter at least ${naira(MIN_GOAL)} to see your weekly target.`}
                  </Text>
                </View>

                <View style={styles.cta}>
                  <Button title="Continue" onPress={() => setStep(2)} disabled={!canContinue} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>How often will you save?</Text>
                <View style={styles.chipsRow}>
                  {FREQUENCIES.map((f) => (
                    <Chip
                      key={f.key}
                      tone="white"
                      label={f.label}
                      selected={f.key === freqKey}
                      onPress={() => pickFrequency(f)}
                    />
                  ))}
                </View>

                <View style={{ marginTop: 18 }}>
                  <MoneyInput value={plan} onChange={setPlan} outlined />
                </View>

                <View style={styles.chipsRow}>
                  {freq.chips.map((n) => (
                    <Chip
                      key={n}
                      tone="white"
                      label={short(n)}
                      selected={planNum === n}
                      onPress={() => setPlan(String(n))}
                    />
                  ))}
                </View>

                <View style={styles.planCard}>
                  <Text style={styles.planTitle}>Your plan</Text>
                  <Text style={styles.planLine}>
                    {planNum > 0 ? `${naira(planNum)} ${freq.every}` : 'Enter an amount'}
                  </Text>
                  <Text style={styles.planLine}>
                    Goal {naira(goalNum)} by {gradLabel}
                  </Text>
                  {planNum > 0 && (
                    <Text style={styles.planLine}>
                      About {plural(timeToReach, freq.unit)} to reach it
                    </Text>
                  )}
                </View>

                {planNum > 0 && (
                  <View style={styles.adviceCard}>
                    <Text style={styles.adviceTitle}>Advice</Text>
                    <Text style={styles.adviceText}>
                      {onTrack
                        ? `You’re on track to reach ${naira(goalNum)} by graduation.`
                        : `At this pace you’d reach ${naira(projected)} by graduation. Raise it to ${naira(suggested)} ${freq.every}.`}
                    </Text>
                  </View>
                )}

                <View style={styles.cta}>
                  <Button title="Start my journey" onPress={start} loading={saving} disabled={planNum <= 0} />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mint },
  scroll: { flex: 1, backgroundColor: BODY_BG },
  scrollContent: { flexGrow: 1 },

  header: { backgroundColor: colors.mint, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 36 },
  back: { marginTop: 12, alignSelf: 'flex-start' },

  body: {
    flex: 1,
    backgroundColor: BODY_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 16,
    paddingBottom: 32,
  },

  stepText: { alignSelf: 'flex-end', fontSize: 12, color: colors.gray, fontWeight: '600' },
  track: { height: 12, borderRadius: 6, backgroundColor: '#A6E4CB', marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.brand },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 },
  purposeCard: {
    width: '48%',
    minHeight: 92,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  purposeCardOn: { borderColor: colors.brand, backgroundColor: '#F1FAF5' },
  purposeText: { fontSize: 16, color: colors.text, textAlign: 'center', marginTop: 6 },

  descInput: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text,
    marginTop: 4,
  },

  question: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 28 },

  moneyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moneyOutlined: { height: 70, borderColor: '#2B2B2B', marginTop: 0 },
  moneySign: { fontSize: 20, fontWeight: '700', color: colors.text, marginRight: 8 },
  moneyInput: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text, height: '100%' },

  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  chip: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrey: { backgroundColor: '#D9D9D9', borderColor: '#D9D9D9' },
  chipWhite: { backgroundColor: colors.white, borderColor: '#2B2B2B' },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  chipTextOn: { color: colors.white },

  banner: { backgroundColor: '#B2E5CF', borderRadius: 12, padding: 14, marginTop: 28 },
  bannerText: { fontSize: 15, color: colors.brand, lineHeight: 20 },

  planCard: { backgroundColor: '#B2E5CF', borderRadius: 14, padding: 14, marginTop: 22 },
  planTitle: { fontSize: 18, fontWeight: '700', color: colors.brand },
  planLine: { fontSize: 17, color: colors.text, lineHeight: 23 },

  adviceCard: { backgroundColor: '#FEF3CC', borderRadius: 14, padding: 14, marginTop: 18 },
  adviceTitle: { fontSize: 18, fontWeight: '700', color: '#9A6B00' },
  adviceText: { fontSize: 17, color: '#5B4300', lineHeight: 23, marginTop: 2 },

  cta: { marginTop: 24 },
});