import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Logo, TextField } from '../components/ui';
import { colors } from '../constants/colors';
import { login } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace('/tabs/home');
    } catch {
      setError('Wrong email, phone number or password. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo />

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>

          <TextField
            icon="person-outline"
            placeholder="Email or Phone Number"
            keyboardType="email-address"
            autoCorrect={false}
            value={identifier}
            onChangeText={setIdentifier}
          />
          <TextField
            icon="shield-outline"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button title="Sign In" onPress={handleSignIn} loading={loading} disabled={!canSubmit} />

          <Pressable
            onPress={() => Alert.alert('Coming soon', 'Password reset is not built yet.')}
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>

          <View style={{ marginTop: 40 }}>
            <Button
              title="Create New Account"
              variant="outlineDark"
              onPress={() => router.push('/register')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mint },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 28 },
  subtitle: { fontSize: 17, color: colors.text, marginTop: 4, marginBottom: 28 },
  error: { color: colors.error, fontSize: 14, marginBottom: 12 },
  forgot: { alignSelf: 'center', paddingVertical: 14 },
  forgotText: { fontSize: 15, fontWeight: '700', color: colors.text },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#8AA597' },
  or: { fontSize: 15, color: colors.text },
});