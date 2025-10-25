import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet, Pressable
} from 'react-native';
import {useTaskStore} from '../src/stores/taskStore';
import {TaskItem} from '../src/components/TaskItem';
import {Link} from 'expo-router';

export default function HomeScreen() {
  const {
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
    initDB
  } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addSubTask(newTaskTitle.trim(), null);
      setNewTaskTitle('');
    }
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
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-gray-600 mt-1">
          {remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining
        </Text>
        <Pressable onPress={initDB} className='mt-2'>
          <Text className={"text-blue-500 font-medium"}>Init Database</Text>
        </Pressable>
      </View>

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