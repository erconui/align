import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { TaskInstance } from '../types';
import { X } from 'lucide-react-native';

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
      onUpdateTitle(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  return (
      <View className="bg-white p-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          {/* Left side: checkbox + text */}
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
                onPress={() => onToggle(task.id)}
                className={`w-6 h-6 rounded border mr-3 items-center justify-center ${
                    task.is_completed
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400 bg-white'
                }`}
            >
              {task.is_completed && (
                  <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </TouchableOpacity>

            {isEditing ? (
                <TextInput
                    value={editTitle}
                    onChangeText={setEditTitle}
                    onBlur={handleSave}
                    onSubmitEditing={handleSave}
                    autoFocus
                    className="flex-1 text-gray-900 text-base py-1 mr-3"
                    placeholder="Task title..."
                />
            ) : (
                <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    className="flex-1 py-1 mr-3 min-w-0"
                >
                  <Text
                      className={`text-base ${
                          task.is_completed
                              ? 'line-through text-gray-400'
                              : 'text-gray-900'
                      }`}
                      numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                </TouchableOpacity>
            )}
          </View>

          {/* Right side: actions */}
          <View className="flex-row items-center">
            {isEditing ? (
                <>
                  <TouchableOpacity
                      onPress={handleSave}
                      className="bg-green-500 px-3 py-2 rounded ml-2"
                  >
                    <Text className="text-white text-sm font-medium">Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={handleCancel}
                      className="bg-gray-300 px-3 py-2 rounded ml-2"
                  >
                    <Text className="text-gray-700 text-sm font-medium">Cancel</Text>
                  </TouchableOpacity>
                </>
            ) : (
                <>
                  <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
                    <Text className="text-gray-500 text-base">✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(task.id)} className="p-2 ml-1">
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </>
            )}
          </View>
        </View>
      </View>
  );
};