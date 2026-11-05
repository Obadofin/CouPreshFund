import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
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
import { AuthButton, AuthField, BrandLogo, InputRef } from '../components/auth';
import { colors } from '../constants/colors';
import { login } from '../lib/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

    const passwordRef = useRef<InputRef>(null);

  const errors = {
    email: EMAIL.test(email.trim()) ? '' : 'Enter a valid email address',
    password: password ? '' : 'Enter your password',
  };

  async function submit() {
    setSubmitted(true);
    setFormError(null);
    if (errors.email || errors.password) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/tabs/home');
    } catch {
      setFormError('Wrong email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo variant="light" width={132} />

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

          <AuthField
            icon="mail-outline"
            placeholder="Email Address"
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={submitted ? errors.email : ''}
          />
          <AuthField
            inputRef={passwordRef}
            icon="lock-closed-outline"
            placeholder="Password"
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            error={submitted ? errors.password : ''}
          />

          <Pressable
            style={styles.forgot}
            hitSlop={8}
            onPress={() => Alert.alert('Coming soon', 'Password reset is not built yet.')}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {formError && <Text style={styles.formError}>{formError}</Text>}

          <AuthButton title="Sign In" onPress={submit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footText}>Don’t have an account? </Text>
            <Pressable onPress={() => router.replace('/register')} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 14 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: 22, lineHeight: 18 },
  forgot: { alignSelf: 'flex-end', marginBottom: 14, marginTop: -2 },
  forgotText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  formError: { fontSize: 13, color: colors.error, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footText: { fontSize: 12, color: colors.muted },
  link: { fontSize: 12, fontWeight: '700', color: colors.primary },
});