import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { colors, radius, spacing } from '../theme/tokens';

type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [batchYear, setBatchYear] = useState(user?.graduationYear ? String(user.graduationYear) : '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    if (!department.trim()) {
      Alert.alert('Missing department', 'Please enter your department.');
      return;
    }

    const parsedBatchYear = Number(batchYear);
    if (batchYear.trim() && (Number.isNaN(parsedBatchYear) || parsedBatchYear < 1900 || parsedBatchYear > 2100)) {
      Alert.alert('Invalid batch year', 'Please enter a valid batch year.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.updateProfile({
        name: name.trim(),
        department: department.trim(),
        batchYear: batchYear.trim() ? parsedBatchYear : undefined,
        headline: headline.trim(),
        bio: bio.trim(),
        skills: skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        profileImageUrl: avatarUrl.trim() || undefined,
      });

      if (response.data) {
        updateUser(response.data);
      }

      Alert.alert('Profile updated', 'Your account details were saved successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Update failed', 'Unable to update your profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <TextInput label="Full name" value={name} onChangeText={setName} placeholder="John Doe" />
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
            placeholder="2027"
            keyboardType="number-pad"
          />
          <TextInput
            label="Headline"
            value={headline}
            onChangeText={setHeadline}
            placeholder="Aspiring software engineer"
          />
          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the department community a bit about yourself"
            multiline
            numberOfLines={5}
            style={styles.textArea}
          />
          <TextInput
            label="Skills"
            value={skills}
            onChangeText={setSkills}
            placeholder="React, Research, Networking"
          />
          <TextInput
            label="Profile Image URL"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://example.com/profile.jpg"
            autoCapitalize="none"
          />

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              loading={isSaving}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
