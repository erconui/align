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
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6"/>
        <Text className="text-lg text-gray-600 mt-4">Loading tasks...</Text>
      </View>
    );
  }

  const remainingTasks = flatTasks.filter(t => !t.completed).length;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={Platform.OS === 'android' ? { paddingTop: 40 } : undefined} className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-gray-600 mt-1">
          {remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining
        </Text>
        <Pressable onPress={initDB} className='mt-2'>
          <Text className={"text-blue-500 font-medium"}>Init Database</Text>
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
      <View className="p-4 bg-white border-b border-gray-200">
        <View className="flex-row">
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a new task..."
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={handleAddTask}
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 text-gray-900 bg-white"
          />
          <TouchableOpacity
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
            className={`px-6 py-3 rounded-r-lg justify-center ${
              newTaskTitle.trim() ? 'bg-blue-500' : 'bg-blue-300'
            }`}
          >
          </TouchableOpacity>
        </View>

        {error && (
          <Text className="text-red-500 mt-2 text-sm">{error}</Text>
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