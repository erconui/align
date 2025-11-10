import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useTaskStore } from '../stores/taskStore';

export default function TemplateSelectorScreen() {
  const { flatTemplates, addTemplateRelation } = useTaskStore();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState(flatTemplates);

  const parentTemplateId = params.parentTemplateId as string;

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = flatTemplates.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(flatTemplates);
    }
  }, [searchQuery, flatTemplates]);

  const handleSelectTemplate = (templateId: string) => {
    if (!parentTemplateId) {
      Alert.alert('Error', 'No parent template specified');
      return;
    }

    addTemplateRelation(parentTemplateId, templateId)
      .then(() => {
        Alert.alert('Success', 'Template added as subtask');
        router.back();
      })
      .catch(error => {
        Alert.alert('Error', 'Failed to add template as subtask');
      });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Select Template</Text>
        <Text className="text-gray-600 mt-1">
          Choose a template to add as subtask
        </Text>
      </View>

      {/* Search */}
      <View className="p-4 bg-white border-b border-gray-200">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search templates..."
          placeholderTextColor="#9CA3AF"
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
        />
      </View>

      {/* Templates List */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelectTemplate(item.id)}
            className="bg-white border-b border-gray-100 px-6 py-4"
          >
            <Text className="text-gray-900 text-base font-medium">
              {item.title}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-lg text-gray-500 text-center">
              {searchQuery ? 'No templates found' : 'No templates available'}
            </Text>
          </View>
        }
      />
    </View>
  );
}