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
  getAllTasks: async (): Promise<TaskInstance[]> => {
    return await webStorage.getTasks(); // webStorage already returns all tasks
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
        completed: isCompleted,
      };

      await webStorage.saveTasks(tasks);
    }
  },
  deleteTask: async (id: string) => {
    const tasks = await webStorage.getTasks();
    const ids: string[] = [id];
    const findAllSubtasks = (parentId: string) => {
      const subtasks = tasks.filter(t => t.parent_id === parentId);
      subtasks.forEach((subtask) => {
        ids.push(subtask.id);
        findAllSubtasks(subtask.id);
      })
    };
    findAllSubtasks(id);
    const remainingTasks = tasks.filter(task => !ids.includes(task.id));
    await webStorage.saveTasks(remainingTasks);

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