import { Link } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { TemplateItem } from '../src/components/TemplateItem';
import { useTaskStore } from '../src/stores/taskStore';

export default function TemplateScreen() {
  const {
    focusedId,
    tree,
    templateHierarchy,
    isLoading,
    error,
    createTemplate,
    addTemplateAfter,
    updateTemplate,
    deleteTemplate,
    loadTemplates,
    createTaskFromTemplate,
    replaceTemplate
  } = useTaskStore();
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddTemplate = () => {
    if (newTemplateTitle.trim()) {
      createTemplate(newTemplateTitle.trim(), null);
      setNewTemplateTitle('');
    }
  };
  const suggestions = useMemo(() => {
    return tree.map(node => ({
      id: node.id,
      title: node.title,
    }));
  }, [tree]);
  // console.log(tree);
  // console.log(suggestions);

  const handleUseTemplate = (templateId: string) => {
    Alert.alert(
      'Use Template',
      'Add this template to your task list?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Add to Tasks',
          onPress: () => createTaskFromTemplate(templateId)
        }
      ]
    );
  };

  const handleDeleteTemplate = (templateId: string, title: string) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${title}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTemplate(templateId)
        }
      ]
    );
  };

  const toggleExpand = (templateId: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6"/>
        <Text className="text-lg text-gray-600 mt-4">Loading templates...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Templates</Text>
        <Text className="text-gray-600 mt-1">
          {tree.length} {tree.length === 1 ? 'template' : 'templates'}
        </Text>

        {/* Navigation */}
        <Link href="/" asChild>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg mt-2">
            <Text className="text-white font-semibold text-center">
              Back to Tasks
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Add Template Form */}
      <View className="p-4 bg-white border-b border-gray-200">
        <View className="flex-row">
          <TextInput
            value={newTemplateTitle}
            onChangeText={setNewTemplateTitle}
            placeholder="Create a new template..."
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={handleAddTemplate}
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 text-gray-900 bg-white"
          />
        </View>

        {error && (
          <Text className="text-red-500 mt-2 text-sm">{error}</Text>
        )}
      </View>

      {/* Templates List */}
      <View className="flex-1">
        {tree.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-lg text-gray-500 text-center">
              No templates yet. Create your first template to get started!
            </Text>
          </View>
        ) : (
          <FlatList
            data={tree}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TemplateItem
                templateNode={item}
                expandedTemplates={expandedTemplates}
                onToggleExpand={toggleExpand}
                onUseTemplate={handleUseTemplate}
                deleteTemplate={deleteTemplate}
                updateTemplate={updateTemplate}
                addTemplateAfter={addTemplateAfter}
                level={0}
                focusedId={focusedId}
                suggestions={suggestions}
                parentId={null}
                replaceTemplate={replaceTemplate}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}