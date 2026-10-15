import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

/* ---------- Button ---------- */
type Variant = 'yellow' | 'green' | 'outlineLight' | 'outlineDark';
type Size = 'lg' | 'md';

const variants = {
  yellow: { bg: colors.yellow, border: 'transparent', width: 0, text: colors.text },
  green: { bg: colors.brand, border: 'transparent', width: 0, text: colors.white },
  outlineLight: { bg: 'transparent', border: colors.white, width: 3, text: colors.white },
  outlineDark: { bg: 'transparent', border: colors.text, width: 1.5, text: colors.text },
};

const sizes = {
  lg: { height: 62, radius: 24, fontSize: 22 },
  md: { height: 46, radius: 14, fontSize: 18 },
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'green',
  size = 'md',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => ({
        height: s.height,
        borderRadius: s.radius,
        backgroundColor: v.bg,
        borderColor: v.border,
        borderWidth: v.width,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: inactive ? 0.6 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: '600' }}>{title}</Text>
      )}
    </Pressable>
  );
}

/* ---------- TextField (add secureTextEntry for a show/hide eye) ---------- */
type TextFieldProps = TextInputProps & {
  icon: ComponentProps<typeof Ionicons>['name'];
};

export function TextField({ icon, secureTextEntry, ...rest }: TextFieldProps) {
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.fieldWrap}>
      <Ionicons name={icon} size={24} color={colors.placeholder} />
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        secureTextEntry={hidden}
        {...rest}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color={colors.placeholder}
          />
        </Pressable>
      )}
    </View>
  );
}

/* ---------- Logo ---------- */
export function Logo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoCircle}>
        <Ionicons name="water" size={26} color={colors.white} />
      </View>
      <View>
        <Text style={styles.logoText}>
          Coupresh<Text style={{ color: colors.brand }}>Fund</Text>
        </Text>
        <Text style={styles.tagline}>SAVE | LEARN | GROW | GRADUATE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  fieldInput: { flex: 1, fontSize: 17, color: colors.text, height: '100%' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 30, fontWeight: '800', color: colors.text },
  tagline: { fontSize: 11, color: colors.text, marginTop: -2 },
});
/* ---------- ComingSoon (placeholder for screens not built yet) ---------- */
export function ComingSoon({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20 }}>{title} (coming soon)</Text>
    </View>
  );
}