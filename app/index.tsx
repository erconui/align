import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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
    deleteTask,
    updateTaskTitle,
    replaceTaskWithTemplate,
    initDB
  } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);
    const [suggestionsPosition, setSuggestionsPosition] = useState<{ x: number; y: number; width: number } | null>(null);
    const [suggestionsItemId, setSuggestionsItemId] = useState<string | null>(null);
    const [suggestionsParentId, setSuggestionsParentId] = useState<string | null>(null);
    const [currentSearchText, setCurrentSearchText] = useState('');

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

  const { colors } = useTheme();

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header */}
      <View style={[Platform.OS === 'android' ? { paddingTop: 40 } : undefined, {paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface}] }>
        <Text style={{color: colors.muted, marginTop: 4}}>
          {remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining
        </Text>
        <Pressable onPress={initDB} style={{marginTop: 8}}>
          <Text style={{color: colors.tint, fontWeight: '500'}}>Init Database</Text>
        </Pressable>
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
      <View style={{padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border}}>
        <View style={{flexDirection: 'row'}}>
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a new task..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleAddTask}
            style={{flex: 1, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, backgroundColor: colors.surface}}
          />
          <TouchableOpacity
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
            style={{paddingHorizontal: 16, paddingVertical: 12, borderTopRightRadius: 8, borderBottomRightRadius: 8, justifyContent: 'center', backgroundColor: newTaskTitle.trim() ? colors.tint : '#93c5fd'}}
          >
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
              suggestions={suggestions}
              replaceTemplate={async (parentId, oldId, newId) => {
                replaceTaskWithTemplate(oldId, newId);
              }}
              onInputMeasure={handleInputMeasure}
              onTextChange={handleTextChange}
            />
          )}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {fontSize: 20, fontWeight: "700", marginBottom: 12},
  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  button: {backgroundColor: "#222", padding: 10, borderRadius: 6},
  buttonText: {color: "white", textAlign: "center"},
});