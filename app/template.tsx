import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GlobalSuggestions } from '../src/components/GlobalSuggestions';
import { TemplateItem } from '../src/components/TemplateItem';
import { useTheme } from '../src/hooks/useTheme';
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
    replaceTemplate,
    removeTemplate,
    toggleTemplateExpand
  } = useTaskStore();
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestionsPosition, setSuggestionsPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [suggestionsItemId, setSuggestionsItemId] = useState<string | null>(null);
  const [suggestionsParentId, setSuggestionsParentId] = useState<string | null>(null);
  const [currentSearchText, setCurrentSearchText] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);
  useEffect(() => {
    setSuggestionsVisible(false);
  }, [focusedId]);

  const handleAddTemplate = () => {
    if (newTemplateTitle.trim()) {
      createTemplate(newTemplateTitle.trim(), null, true);
      setNewTemplateTitle('');
    }
  };

  const handleInputMeasure = (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => {
    setSuggestionsPosition(position);
    setSuggestionsItemId(itemId);
    setSuggestionsParentId(parentId || null);
    setSuggestionsVisible(true);
  };

  const handleTextChange = (text: string) => {
    setCurrentSearchText(text);
    setSuggestionsVisible(text.length > 0);
  };

  const handleSuggestionSelect = async (suggestion: { id: string; title: string }, itemId: string, parentId: string | null) => {
    await replaceTemplate(parentId, itemId, suggestion.id);
    setSuggestionsVisible(false);
    setCurrentSearchText('');
    setSuggestionsItemId(null);
    setSuggestionsParentId(null);
  };

  const closeSuggestions = () => {
    setTimeout(() => {
      setSuggestionsVisible(false);
    }, 200);
  };

  const suggestions = useMemo(() => {
    return tree.map(node => ({
      id: node.id,
      title: node.title,
    }));
  }, [tree]);

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
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" color="#3B82F6"/>
        <Text style={{fontSize: 18, color: '#6B7280', marginTop: 16}}>Loading lists...</Text>
      </View>
    );
  }
  const { colors, styles } = useTheme();

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{fontSize: 24, fontWeight: '700', color: colors.text}}>Lists</Text>
        <Text style={{color: colors.muted, marginTop: 4}}>
          {tree.length} {tree.length === 1 ? 'list' : 'lists'}
        </Text>
      </View>

      {/* Add Template Form */}
      <View style={{padding: 16, backgroundColor: colors.background,  borderBottomColor: colors.border}}>
        <View style={{flexDirection: 'row'}}>
          <TextInput
            value={newTemplateTitle}
            onChangeText={setNewTemplateTitle}
            placeholder="Add a new list..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleAddTemplate}
            style={{...styles.input, flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, padding:16, marginHorizontal:0}}
          />
          <TouchableOpacity
            onPress={handleAddTemplate}
            disabled={!newTemplateTitle.trim()}
            style={{borderTopRightRadius: 8, borderBottomRightRadius: 8, ...styles.pressableButton}}
          >
            <Ionicons name="add" size={20} color={colors.tint} paddingVertical={styles.pressableButton.paddingVertical} />
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={{color: '#ef4444', marginTop: 8, fontSize: 12}}>{error}</Text>
        )}
      </View>

      {/* Global Suggestions */}
      <GlobalSuggestions
        suggestions={suggestions}
        position={suggestionsPosition}
        visible={suggestionsVisible}
        searchText={currentSearchText}
        onSuggestionSelect={(suggestion) => {
          if (suggestionsItemId) {
            handleSuggestionSelect(suggestion, suggestionsItemId, suggestionsParentId);
          }
        }}
      />

      {/* Templates List */}
      <View className="flex-1">
        {tree.length === 0 ? (
          <View style={styles.settingsRow}>
            <Text style={styles.headerText}>
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
                focusedId={focusedId}
                parentId={null}
                removeTemplate={removeTemplate}
                onInputMeasure={handleInputMeasure}
                onTextChange={handleTextChange}
                generateList={createTaskFromTemplate}
                toggleExpand={async (parentId, id) => {toggleTemplateExpand(parentId, id);}}
                closeSuggestions={closeSuggestions}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}