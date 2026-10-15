import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/ui';
import { colors } from '../../constants/colors';

// Sample data. Later this will come from the backend.
const user = { saved: 125000 };

const PERIODS = [
  { label: '6m', months: 6, text: '6 months' },
  { label: '1y', months: 12, text: '1 year' },
  { label: '2y', months: 24, text: '2 years' },
];
const RATES = [4, 8, 12]; // tap the rate chip to cycle through these
const MIN = 1000;
const MAX = 10000;
const STEP = 500;
const THUMB = 24;

const naira = (n: number) => '₦' + n.toLocaleString('en-US');

// Compound interest, added monthly. Illustration only, no real investment.
function project(start: number, monthly: number, months: number, annualRate: number) {
  const r = annualRate / 100 / 12;
  let balance = start;
  for (let i = 0; i < months; i++) balance = balance * (1 + r) + monthly;
  const added = start + monthly * months;
  return { total: Math.round(balance), added, growth: Math.round(balance - added) };
}

/* ---------- Slider (no extra install needed) ---------- */
type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

function Slider({ value, min, max, step, onChange }: SliderProps) {
  const widthRef = useRef(0);
  const [width, setWidth] = useState(0);
  const latest = useRef({ min, max, step, onChange });
  latest.current = { min, max, step, onChange };

  const update = (x: number) => {
    const w = widthRef.current;
    if (!w) return;
    const { min, max, step, onChange } = latest.current;
    const ratio = Math.min(1, Math.max(0, x / w));
    const stepped = Math.round((min + ratio * (max - min)) / step) * step;
    onChange(Math.min(max, Math.max(min, stepped)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // stop the page scrolling while dragging
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const ratio = (value - min) / (max - min);

  return (
    <View style={styles.sliderArea} onLayout={onLayout} {...pan.panHandlers}>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: ratio * width - THUMB / 2 }]}
      />
    </View>
  );
}

/* ---------- Chip ---------- */
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Screen ---------- */
export default function Goals() {
  const router = useRouter();
  const [monthly, setMonthly] = useState(5000);
  const [periodIdx, setPeriodIdx] = useState(2);
  const [rateIdx, setRateIdx] = useState(1);
  const [notified, setNotified] = useState(false);

  const period = PERIODS[periodIdx];
  const rate = RATES[rateIdx];
  const { total, added, growth } = project(user.saved, monthly, period.months, rate);

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
          <Text style={styles.title}>Growth Unlock</Text>

          <View style={styles.intro}>
            <Text style={styles.introText}>
              Unlock at Grower. See how your savings could grow. This is a simulation
            </Text>
          </View>

          {/* Monthly add */}
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Monthly add</Text>
            <Text style={styles.monthlyValue}>{naira(monthly)}</Text>
          </View>
          <Slider value={monthly} min={MIN} max={MAX} step={STEP} onChange={setMonthly} />

          {/* Period + rate chips */}
          <View style={styles.chips}>
            {PERIODS.map((p, i) => (
              <Chip
                key={p.label}
                label={p.label}
                selected={i === periodIdx}
                onPress={() => setPeriodIdx(i)}
              />
            ))}
            <Chip
              label={`${rate}%`}
              selected={false}
              onPress={() => setRateIdx((i) => (i + 1) % RATES.length)}
            />
          </View>

          {/* Result card */}
          <View style={styles.result}>
            <Text style={styles.resultLabel}>Illustrative value at {period.text}</Text>
            <Text style={styles.resultAmount}>{naira(total)}</Text>
            <Text style={styles.resultSub}>
              You add {naira(added)} ~ growth {naira(growth)}
            </Text>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Illustrations only. Not advice. No money is invested. Returns are not guaranteed.
            </Text>
          </View>

          {/* Notify me */}
          <Pressable
            style={[styles.notify, notified && styles.notifyDone]}
            disabled={notified}
            onPress={() => setNotified(true)}
            accessibilityRole="button"
          >
            {notified && <Ionicons name="checkmark" size={16} color={colors.brand} />}
            <Text style={styles.notifyText}>
              {notified ? 'We’ll notify you' : 'Notify me when available'}
            </Text>
          </Pressable>
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

  title: { fontSize: 22, fontWeight: '600', color: colors.text, marginTop: 8 },

  intro: { backgroundColor: '#D2E7DC', borderRadius: 14, padding: 14, marginTop: 16 },
  introText: { fontSize: 17, color: colors.text, lineHeight: 21 },

  monthlyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  monthlyLabel: { fontSize: 15, color: colors.gray },
  monthlyValue: { fontSize: 15, fontWeight: '700', color: colors.text },

  sliderArea: { height: 32, justifyContent: 'center', marginTop: 4 },
  track: { height: 12, borderRadius: 6, backgroundColor: '#A6E4CB', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.brand },
  thumb: {
    position: 'absolute',
    top: (32 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.brand,
  },

  chips: { flexDirection: 'row', gap: 8, marginTop: 14 },
  chip: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D2E7DC',
    borderWidth: 1,
    borderColor: '#8DB8A2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  chipTextOn: { color: colors.white },

  result: { backgroundColor: colors.forest, borderRadius: 14, padding: 14, marginTop: 18 },
  resultLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  resultAmount: { color: colors.white, fontSize: 34, fontWeight: '800', marginTop: 4 },
  resultSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 10, lineHeight: 21 },

  disclaimer: { backgroundColor: '#FEF3CC', borderRadius: 14, padding: 14, marginTop: 18 },
  disclaimerText: { fontSize: 16, color: '#5B4300', lineHeight: 21 },

  notify: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 20,
  },
  notifyDone: { opacity: 0.7 },
  notifyText: { fontSize: 14, color: colors.brand, fontWeight: '500' },
});