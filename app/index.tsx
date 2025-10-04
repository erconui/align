import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { useTaskStore } from '../src/stores/taskStore';
import { TaskItem } from '../src/components/TaskItem';

export default function HomeScreen() {
    const { tasks, isLoading, error, addTask, toggleTask, deleteTask, updateTaskTitle } = useTaskStore();
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            addTask(newTaskTitle.trim());
            setNewTaskTitle('');
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-lg text-gray-600 mt-4">Loading tasks...</Text>
            </View>
        );
    }

    const remainingTasks = tasks.filter(t => !t.is_completed).length;

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-200">
                <Text className="text-2xl font-bold text-gray-900">My Tasks</Text>
                <Text className="text-gray-600 mt-1">
                    {remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining
                </Text>
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
                        <Text className="text-white font-semibold">Add</Text>
                    </TouchableOpacity>
                </View>

                {error && (
                    <Text className="text-red-500 mt-2 text-sm">{error}</Text>
                )}
            </View>

            {/* Tasks List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TaskItem
                        task={item}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onUpdateTitle={updateTaskTitle}
                    />
                )}
                className="flex-1 p-4"
                contentContainerStyle={tasks.length === 0 ? { flex: 1 } : undefined}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-8">
                        <Text className="text-gray-500 text-lg">No tasks yet</Text>
                        <Text className="text-gray-400 mt-2">Add a task to get started!</Text>
                    </View>
                }
            />
        </View>
    );
}