import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, TabParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/tokens';

type JobsScreenProps = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Jobs'>,
    NativeStackNavigationProp<MainStackParamList>
  >;
};

export const JobsScreen: React.FC<JobsScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const canPostJobs = user?.role === 'ADMIN';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.getJobs();
      return response.data as Job[];
    },
  });

  const renderJob = ({ item }: { item: Job }) => (
    <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Career Opportunities</Text>
            <Text style={styles.subtitle}>
              {user?.role === 'ADMIN'
                ? 'Review submitted applications or publish official opportunities for the department.'
                : 'Browse internships and jobs posted by admins, then apply from mobile.'}
            </Text>
            {canPostJobs ? (
              <Button title="Add Job" onPress={() => navigation.navigate('CreateJob')} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="briefcase-outline"
              title="No jobs available"
              message="Check back later for new opportunities"
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
});
