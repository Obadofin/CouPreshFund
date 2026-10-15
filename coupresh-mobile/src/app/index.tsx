import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { colors } from '../constants/colors';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.logoCircle}>
          <Ionicons name="school-outline" size={52} color={colors.text} />
        </View>
        <Text style={styles.brand}>CoupreshFund  Grad</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.headline}>Save.Learn.{'\n'}Grow.{'\n'}Graduate.</Text>
        <Text style={styles.sub}>
          Join students building capital{'\n'}before convocation.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Button
          title="Get started, it’s free"
          variant="yellow"
          size="lg"
          onPress={() => router.push('/register')}
        />
        <Button
          title="I already have an account"
          variant="outlineLight"
          size="lg"
          onPress={() => router.push('/login')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.forest, paddingHorizontal: 16, paddingBottom: 24 },
  top: { alignItems: 'center', marginTop: 24 },
  logoCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.white, fontSize: 24, fontWeight: '600', marginTop: 20 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headline: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 44,
  },
  sub: { color: colors.white, fontSize: 16, textAlign: 'center', marginTop: 48, lineHeight: 22 },
  bottom: { gap: 24 },
});