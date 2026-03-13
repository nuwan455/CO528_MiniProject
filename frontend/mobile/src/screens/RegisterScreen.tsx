import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/tokens';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI' | 'ADMIN'>('STUDENT');
  const [department, setDepartment] = useState('Computer Science');
  const [batchYear, setBatchYear] = useState(String(new Date().getFullYear() + 1));
  const [headline, setHeadline] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !department || !batchYear) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const parsedBatchYear = Number(batchYear);
    if (Number.isNaN(parsedBatchYear) || parsedBatchYear < 1900 || parsedBatchYear > 2100) {
      Alert.alert('Error', 'Please enter a valid batch year');
      return;
    }

    const normalizedName = fullName.trim().replace(/\s+/g, ' ');
    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      await register({
        name: normalizedName,
        email: normalizedEmail,
        password,
        role,
        department: department.trim(),
        batchYear: parsedBatchYear,
        headline: headline.trim(),
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the DECP community</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
              />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Role</Text>
                <View style={styles.roleGroup}>
                  {(['STUDENT', 'ALUMNI', 'ADMIN'] as const).map((option) => {
                    const selected = role === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.roleButton, selected && styles.roleButtonSelected]}
                        onPress={() => setRole(option)}
                      >
                        <Text style={[styles.roleButtonText, selected && styles.roleButtonTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TextInput
                label="Department"
                value={department}
                onChangeText={setDepartment}
                placeholder="Computer Science"
              />
              <TextInput
                label="Batch Year"
                value={batchYear}
                onChangeText={setBatchYear}
                placeholder={String(new Date().getFullYear() + 1)}
                keyboardType="number-pad"
              />
              <TextInput
                label="Headline"
                value={headline}
                onChangeText={setHeadline}
                placeholder="Aspiring software engineer"
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
              />
              <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('Login')}
                variant="ghost"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  form: {
    gap: spacing.base,
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  roleGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  roleButtonTextSelected: {
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
});
