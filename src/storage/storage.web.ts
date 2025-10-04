import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskInstance } from '../types';

const STORAGE_KEY = '@tasks_data';

export const webStorage = {
  getTasks: async (): Promise<TaskInstance[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tasks from storage:', error);
      return [];
    }
  },

  saveTasks: async (tasks: TaskInstance[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
    }
  },

  addTask: async (task: Omit<TaskInstance, 'id'>): Promise<string> => {
    const tasks = await webStorage.getTasks();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newTask: TaskInstance = {
      ...task,
      id,
    };

    tasks.push(newTask);
    await webStorage.saveTasks(tasks);
    return id;
  },

  toggleTask: async (id: string, isCompleted: boolean): Promise<void> => {
    const tasks = await webStorage.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      };

      await webStorage.saveTasks(tasks);
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    const tasks = await webStorage.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);
    await webStorage.saveTasks(filteredTasks);
  },

  updateTaskTitle: async (id: string, title: string): Promise<void> => {
    const tasks = await webStorage.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
      };

      await webStorage.saveTasks(tasks);
    }
  },
};

export const initStorage = async (): Promise<void> => {
  // No initialization needed for web
};
export const storage = webStorage;