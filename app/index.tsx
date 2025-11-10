import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ProgressBar } from 'rn-inkpad';
import { GlobalSuggestions } from '../src/components/GlobalSuggestions';
import { TaskItem } from '../src/components/TaskItem';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

export default function HomeScreen() {
  const {
    tree,
    focusedId,
    tasks,
    flatTasks,
    isLoading,
    error,
    addSubTask,
    addTaskAfter,
    toggleTask,
    toggleTaskExpand,
    deleteTask,
    updateTaskTitle,
    replaceTaskWithTemplate,
    createTemplateFromTask,
    percentage
  } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);
    const [suggestionsPosition, setSuggestionsPosition] = useState<{ x: number; y: number; width: number } | null>(null);
    const [suggestionsItemId, setSuggestionsItemId] = useState<string | null>(null);
    const [suggestionsParentId, setSuggestionsParentId] = useState<string | null>(null);
    const [currentSearchText, setCurrentSearchText] = useState('');

    useEffect(() => {
      setSuggestionsVisible(false);
    }, [focusedId]);

  const suggestions = useMemo(() => {
    return tree.map(node => ({
      id: node.id,
      title: node.title,
    }));
  }, [tree]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addSubTask(newTaskTitle.trim(), null);
      setNewTaskTitle('');
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
    await replaceTaskWithTemplate(itemId, suggestion.id);
    setSuggestionsVisible(false);
    setCurrentSearchText('');
    setSuggestionsItemId(null);
    setSuggestionsParentId(null);
  };
  
  if (isLoading) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" color="#3B82F6"/>
        <Text style={{fontSize: 18, color: '#6B7280', marginTop: 16}}>Loading tasks...</Text>
      </View>
    );
  }

  const remainingTasks = flatTasks.filter(t => !t.completed).length;

  const { colors, styles } = useTheme();

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{color: colors.muted, marginTop: 4}}>
          {remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining
        </Text>
        <ProgressBar value={percentage}
          progressColor={colors.highlight}
          backgroundColor={colors.button}
          textColor={percentage>45? colors.text: colors.muted}
          rounded
          showPercent />
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

      {/* Add Task Form */}
      <View style={{padding: 16, backgroundColor: colors.background,  borderBottomColor: colors.border}}>
        <View style={{flexDirection: 'row'}}>
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a new task..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleAddTask}
            style={{...styles.input, flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, padding:16, marginHorizontal:0 }}
          />
          <TouchableOpacity
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
            style={{...styles.pressableButton, borderTopRightRadius: 8, borderBottomRightRadius: 8}}
          >
            <Ionicons name="add" size={20} color={colors.tint} paddingVertical={styles.pressableButton.paddingVertical} />
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={{color: '#ef4444', marginTop: 8, fontSize: 12}}>{error}</Text>
        )}
      </View>
      <View className="flex-1">
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TaskItem
              key={item.id}
              taskNode={item}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              addSubTask={addSubTask}
              addTaskAfter={addTaskAfter}
              updateTaskTitle={updateTaskTitle}
              focusedId={focusedId}
              replaceTemplate={async (parentId, oldId, newId) => {
                replaceTaskWithTemplate(oldId, newId);
              }}
              toggleExpand={async (parentId, id) => {
                toggleTaskExpand(id);}}
              onInputMeasure={handleInputMeasure}
              onTextChange={handleTextChange}
              generateList={createTemplateFromTask}
            />
          )}/>
      </View>
    </View>
  );
}
