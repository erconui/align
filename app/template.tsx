import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert
} from 'react-native';
import {useTaskStore} from '../src/stores/taskStore';
import {TemplateItem} from '../src/components/TemplateItem';
import {Link} from 'expo-router';

export default function TemplateScreen() {
  const {
    tree,
    templateHierarchy,
    isLoading,
    error,
    createTemplate,
    deleteTemplate,
    loadTemplates,
    createTaskFromTemplate
  } = useTaskStore();
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddTemplate = () => {
    if (newTemplateTitle.trim()) {
      createTemplate(newTemplateTitle.trim());
      setNewTemplateTitle('');
    }
  };

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

  // const buildTemplateTree = () => {
  //     const { templates, relations } = templateHierarchy;
  //     console.log('build tree', templateHierarchy);
  //
  //     // Find root templates (no parents OR have children)
  //     const rootTemplates = templates.filter(template => {
  //         const hasParent = relations.some(rel => rel.child_template_id === template.id);
  //         const hasChildren = relations.some(rel => rel.parent_template_id === template.id);
  //         return !hasParent || hasChildren;
  //     });
  //     console.log(`build tree roots: ${rootTemplates}`);
  //
  //     const buildHierarchy = (parentId: string): any[] => {
  //         const children = relations
  //             .filter(rel => rel.parent_template_id === parentId)
  //             .sort((a, b) => a.sort_order - b.sort_order)
  //             .map(rel => {
  //                 const template = templates.find(t => t.id === rel.child_template_id);
  //                 if (!template) return null;
  //
  //                 return {
  //                     ...template,
  //                     children: buildHierarchy(template.id)
  //                 };
  //             })
  //             .filter(Boolean);
  //         console.log(`build hierarchy: ${parentId} with children: ${children}`);
  //         console.log(relations);
  //
  //         return children;
  //     };
  //
  //     return rootTemplates.map(template => ({
  //         ...template,
  //         children: buildHierarchy(template.id)
  //     }));
  // };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6"/>
        <Text className="text-lg text-gray-600 mt-4">Loading templates...</Text>
      </View>
    );
  }

  // const templateTree = buildTemplateTree();
  // console.log("templateTree", templateTree);

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
          {/*<TouchableOpacity*/}
          {/*    onPress={handleAddTemplate}*/}
          {/*    disabled={!newTemplateTitle.trim()}*/}
          {/*    className={`px-6 py-3 rounded-r-lg justify-center ${*/}
          {/*        newTemplateTitle.trim() ? 'bg-green-500' : 'bg-green-300'*/}
          {/*    }`}*/}
          {/*>*/}
          {/*    <Text className="text-white font-semibold">Create</Text>*/}
          {/*</TouchableOpacity>*/}
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
                level={0}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}