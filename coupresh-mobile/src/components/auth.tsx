import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ComponentRef, Ref, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
export type InputRef = ComponentRef<typeof TextInput>;

/* ---------- Official logo ---------- */
const LOGOS = {
  light: { source: require('../../assets/images/logo-light.png'), ratio: 708 / 552 },
  dark: { source: require('../../assets/images/logo-dark.png'), ratio: 707 / 550 },
};

// "light" is for light backgrounds, "dark" is for dark backgrounds
export function BrandLogo({ variant, width }: { variant: 'light' | 'dark'; width: number }) {
  const logo = LOGOS[variant];
  return (
    <Image
      source={logo.source}
      style={{ width, height: width / logo.ratio }}
      resizeMode="contain"
      accessibilityLabel="CoupreshFund"
    />
  );
}

/* ---------- Text field: icon, error message, show/hide password ---------- */
type FieldProps = TextInputProps & {
  icon: ComponentProps<typeof Ionicons>['name'];
  error?: string;
  inputRef?: Ref<InputRef>;
};

export function AuthField({ icon, error, inputRef, secureTextEntry, ...rest }: FieldProps) {
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.block}>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <Ionicons name={icon} size={18} color={colors.muted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={colors.hint}
          autoCapitalize="none"
          secureTextEntry={hidden}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* ---------- Main button ---------- */
type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function AuthButton({ title, onPress, loading = false, disabled = false }: ButtonProps) {
  const inactive = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { opacity: inactive ? 0.6 : pressed ? 0.85 : 1 }]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  fieldError: { borderColor: colors.error },
  input: { flex: 1, fontSize: 14, color: colors.ink, height: '100%' },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 2 },

  button: {
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 14, fontWeight: '700', color: colors.white },
});