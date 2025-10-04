import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskInstance } from '../types';

// Web-compatible storage solution
const STORAGE_KEY = '@tasks_data';

const webStorage = {
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
            // created_at: new Date().toISOString(),
            // updated_at: new Date().toISOString(),
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
                // updated_at: new Date().toISOString(),
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
                // updated_at: new Date().toISOString(),
            };

            await webStorage.saveTasks(tasks);
        }
    },
};

// Use SQLite for native, AsyncStorage for web
export const storage = Platform.OS === 'web' ? webStorage : {
    getTasks: async (): Promise<TaskInstance[]> => {
        try {
            const { database } = await import('./database');
            return await database.getRootTasks();
        } catch (error) {
            console.error('Error getting tasks from SQLite:', error);
            return [];
        }
    },

    addTask: async (task: Omit<TaskInstance, 'id'>): Promise<string> => {
        const { database } = await import('./database');
        return await database.addTask(task);
    },

    toggleTask: async (id: string, isCompleted: boolean): Promise<void> => {
        const { database } = await import('./database');
        await database.toggleTask(id, isCompleted);
    },

    deleteTask: async (id: string): Promise<void> => {
        const { database } = await import('./database');
        await database.deleteTask(id);
    },

    updateTaskTitle: async (id: string, title: string): Promise<void> => {
        const { database } = await import('./database');
        await database.updateTaskTitle(id, title);
    },
};

export const initStorage = async (): Promise<void> => {
    if (Platform.OS !== 'web') {
        const { initDatabase } = await import('./database');
        await initDatabase();
    }
    // Web doesn't need initialization
};