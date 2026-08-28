import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LogIn, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography } from '../theme';
import { useI18n } from '../i18n';

/** The operator account this prototype accepts.
 *
 * This is a client-side check, so the values ship inside the bundle and anyone
 * with the app can read them — it gates the demo flow, it is not a security
 * control. Real deployments need to verify against a server. */
const OPERATOR_USERNAME = 'ddaofficer';
const OPERATOR_PASSWORD = 'dda12';

type Props = {
  /** Called once the operator has supplied valid credentials. */
  onSignIn: () => void;
};

export const LoginScreen: React.FC<Props> = ({ onSignIn }) => {
  const { theme } = useTheme();
  const { translateAny } = useI18n();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = () => {
    if (!username.trim() || !password) {
      setError(translateAny('Please enter both username and password.'));
      return;
    }
    // Username is matched case-insensitively (operators type it by hand, often
    // with an autocapitalising keyboard); the password is matched exactly.
    if (username.trim().toLowerCase() !== OPERATOR_USERNAME || password !== OPERATOR_PASSWORD) {
      setError(translateAny('Incorrect username or password.'));
      return;
    }
    setError('');
    onSignIn();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <LogIn size={26} color={theme.textPrimary} strokeWidth={1.5} />
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {translateAny('Sign in')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {translateAny('Secure identity verification.')}
          </Text>

          <View style={styles.fields}>
            <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <User size={16} color={theme.textSecondary} strokeWidth={1.5} />
              <TextInput
                placeholder={translateAny('Username')}
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={(v) => { setUsername(v); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: theme.textPrimary }]}
                selectionColor={theme.accentTeal}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Lock size={16} color={theme.textSecondary} strokeWidth={1.5} />
              <TextInput
                placeholder={translateAny('Password')}
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: theme.textPrimary }]}
                selectionColor={theme.accentTeal}
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                {showPassword
                  ? <EyeOff size={16} color={theme.textSecondary} strokeWidth={1.5} />
                  : <Eye size={16} color={theme.textSecondary} strokeWidth={1.5} />}
              </Pressable>
            </View>

            {/* Error and the forgot-password link share this row, as in the
                reference; the link stays put when no error is showing. */}
            <View style={styles.metaRow}>
              {error ? (
                <Text style={[styles.error, { color: theme.accentRed }]}>{error}</Text>
              ) : (
                <View style={styles.spacer} />
              )}
              <Pressable hitSlop={8}>
                <Text style={[styles.forgot, { color: theme.textSecondary }]}>
                  {translateAny('Forgot password?')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: theme.textPrimary, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={[styles.submitText, { color: theme.background }]}>
              {translateAny('Get Started')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    marginBottom: 28,
    textAlign: 'center',
  },
  fields: {
    width: '100%',
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    // Strips the focus ring react-native-web puts on inputs, which does not
    // match the rest of the app's borders.
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
  },
  spacer: {
    flex: 1,
  },
  error: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    paddingRight: 12,
  },
  forgot: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
  },
  submit: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 22,
  },
  submitText: {
    fontFamily: typography.fonts.medium,
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
