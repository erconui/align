import { TaskInstance } from '../types';
import { database, initDatabase } from '../database/database';

const nativeStorage = {
  getTasks: async (): Promise<TaskInstance[]> => {
    try {
      return await database.getRootTasks();
    } catch (error) {
      console.error('Error getting tasks from SQLite:', error);
      return [];
    }
  },
  getAllTasks: async (): Promise<TaskInstance[]> => {
    try {
      return await database.getAllTasks();
    } catch (error) {
      console.error('Error getting tasks from SQLite:', error);
      return [];
    }
  },
  addTask: async (task: Omit<TaskInstance, 'id'>): Promise<string> => {
    return await database.addTask(task);
  },
  toggleTask: async (id: string, isCompleted: boolean): Promise<void> => {
    await database.toggleTask(id, isCompleted);
  },
  deleteTask: async (id: string): Promise<void> => {
    await database.deleteTask(id);
  },
  updateTaskTitle: async (id: string, title: string): Promise<void> => {
    await database.updateTaskTitle(id, title);
  },
};

export const initStorage = async (): Promise<void> => {
  await initDatabase();
};

export const storage = nativeStorage;