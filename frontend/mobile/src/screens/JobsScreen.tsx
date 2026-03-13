import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing } from '../theme/tokens';

type JobsScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Jobs'>;
};

export const JobsScreen: React.FC<JobsScreenProps> = ({ navigation }) => {
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
  },
});
