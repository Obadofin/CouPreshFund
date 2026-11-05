import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import { register } from '../lib/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts 0803..., 234803... or +234803...
function validPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('234')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^[789][01]\d{8}$/.test(local);
}

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

    const emailRef = useRef<InputRef>(null);
    const phoneRef = useRef<InputRef>(null);
    const passwordRef = useRef<InputRef>(null);

  const errors = {
    fullName: fullName.trim().length < 2 ? 'Enter your full name' : '',
    email: EMAIL.test(email.trim()) ? '' : 'Enter a valid email address',
    phone: phone.trim() && !validPhone(phone) ? 'Enter a valid Nigerian phone number' : '',
    password: password.length < 8 ? 'Use at least 8 characters' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function submit() {
    setSubmitted(true);
    setFormError(null);
    if (hasErrors) return;

    setLoading(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password });
      router.replace('/tabs/home');
    } catch {
      setFormError('We could not create your account. Please try again.');
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

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join thousands of students building a better future.</Text>

          <AuthField
            icon="person-outline"
            placeholder="Full Name"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            value={fullName}
            onChangeText={setFullName}
            onSubmitEditing={() => emailRef.current?.focus()}
            error={submitted ? errors.fullName : ''}
          />
          <AuthField
            inputRef={emailRef}
            icon="mail-outline"
            placeholder="Email Address"
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => phoneRef.current?.focus()}
            error={submitted ? errors.email : ''}
          />
          <AuthField
            inputRef={phoneRef}
            icon="phone-portrait-outline"
            placeholder="Phone Number"
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="next"
            value={phone}
            onChangeText={setPhone}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={submitted ? errors.phone : ''}
          />
          <AuthField
            inputRef={passwordRef}
            icon="lock-closed-outline"
            placeholder="Password"
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            error={submitted ? errors.password : ''}
          />

          {formError && <Text style={styles.formError}>{formError}</Text>}

          <View style={{ marginTop: 6 }}>
            <AuthButton title="Create Account" onPress={submit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/login')} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>Log in</Text>
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
  formError: { fontSize: 13, color: colors.error, marginBottom: 6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footText: { fontSize: 12, color: colors.muted },
  link: { fontSize: 12, fontWeight: '700', color: colors.primary },
});