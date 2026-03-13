import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/tokens';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>Welcome to DECP</Text>
          <Text style={styles.subtitle}>
            Connect with your department community, discover opportunities, and advance your career
          </Text>
        </View>

        <View style={styles.actions}>
          <Button title="Sign In" onPress={() => navigation.navigate('Login')} size="lg" />
          <Button
            title="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="secondary"
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing['4xl'],
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
  },
  actions: {
    gap: spacing.md,
  },
});
