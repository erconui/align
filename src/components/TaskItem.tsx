import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { TaskInstance } from '../types';

interface TaskItemProps {
  task: TaskInstance;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onUpdateTitle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdateTitle(task.id, editTitle);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  return (
    <View className="bg-white p-4 rounded-lg border border-gray-200 mb-2 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => onToggle(task.id)}
            className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
              task.is_completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300'
            }`}
          >
            {task.is_completed && (
              <Text className="text-white text-xs">✓</Text>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              onBlur={handleSave}
              onSubmitEditing={handleSave}
              autoFocus
              className="flex-1 text-gray-900 text-base border-b border-blue-500 py-1"
            />
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="flex-1"
            >
              <Text
                className={`text-base ${
                  task.is_completed 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-900'
                }`}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row ml-2">
          {isEditing ? (
            <TouchableOpacity onPress={handleCancel} className="ml-2">
              <Text className="text-red-500 text-lg">✕</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onDelete(task.id)}
              className="ml-2"
            >
              <Text className="text-red-500 text-lg">×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};