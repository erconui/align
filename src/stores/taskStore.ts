import { create } from 'zustand';
import { TaskInstance } from '../types';
import { storage, initStorage } from '../storage/storage';

interface TaskStore {
    tasks: TaskInstance[];
    isLoading: boolean;
    error: string | null;

    // Actions
    init: () => Promise<void>;
    addTask: (title: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateTaskTitle: (id: string, title: string) => Promise<void>;
    loadTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    init: async () => {
        try {
            set({ isLoading: true, error: null });
            await initStorage();
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        } finally {
            set({ isLoading: false });
        }
    },

    loadTasks: async () => {
        try {
            const tasks = await storage.getTasks();
            set({ tasks, error: null });
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    addTask: async (title: string) => {
        if (!title.trim()) return;

        try {
            const newTask: Omit<TaskInstance, 'id'> = {
                template_id: null,
                parent_instance_id: null,
                title: title.trim(),
                is_completed: false,
                due_date: null,
                recurrence_rule: null,
                completed_at: null,
                sort_order: get().tasks.length,
            };

            await storage.addTask(newTask);
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    toggleTask: async (id: string) => {
        try {
            const task = get().tasks.find(t => t.id === id);
            if (!task) return;

            await storage.toggleTask(id, !task.is_completed);
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    deleteTask: async (id: string) => {
        try {
            await storage.deleteTask(id);
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    updateTaskTitle: async (id: string, title: string) => {
        if (!title.trim()) return;

        try {
            await storage.updateTaskTitle(id, title.trim());
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
}));