import {create} from 'zustand';
import {TaskInstance} from '../types';
import {initStorage, storage} from '../storage/storage';

export type TaskNode = TaskInstance & { children: TaskNode[] };

interface TaskStore {
    tasks: TaskNode[];
    flatTasks: TaskInstance[];
    isLoading: boolean;
    error: string | null;

    // Actions
    init: () => Promise<void>;
    initDB: () => Promise<void>;
    loadTasks: () => Promise<void>;
    getTree: (tasks: TaskInstance[]) => TaskNode[];
    addTask: (title: string, parentId: string | null) => Promise<void>;
    addTaskWithoutLoad: (id: string, parentId: string | null) => Promise<string>;
    updateTaskTitle: (id: string, title: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    deleteAllTasks: () => void;
    toggleTask: (id: string) => Promise<void>;
    recursiveUpdateChildren: (id: string, completed: boolean) => Promise<void>;
    recursiveUpdateParents: (id: string | null, completed: boolean) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    flatTasks: [],
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
    initDB: async () => {
        try {
            set({ isLoading: true, error: null });

            // Clear all existing tasks
            await get().deleteAllTasks();

            // Create all tasks first, then load once at the end
            const task1id = await get().addTaskWithoutLoad('Task 1', null);
            const task2id = await get().addTaskWithoutLoad('Task 2', null);
            const task3id = await get().addTaskWithoutLoad('Task 3', null);
            if (task1id) await get().addTaskWithoutLoad('Sub 1', task1id);
            if (task3id) {
                const sub2id = await get().addTaskWithoutLoad('Sub 2', task3id);
                await get().addTaskWithoutLoad('Sub 3', task3id);
                const sub4 = await get().addTaskWithoutLoad('Sub 4', task3id);
                await get().addTaskWithoutLoad('Sub 5', sub4);
            }
            await get().addTaskWithoutLoad('Task 4', null);
            for (let idx=5; idx < 15; idx++) {
                await get().addTaskWithoutLoad(`Task ${idx}`, null);
            }
            // Single load at the end
            await get().loadTasks();

        } catch (error) {
            console.error('Error initializing database:', error);
            set({ error: (error as Error).message });
        } finally {
            set({ isLoading: false });
        }
    },
    loadTasks: async () => {
        try {
            const flatTasks = await storage.getAllTasks();
            const tree = get().getTree(flatTasks);
            set({
                tasks: tree,
                flatTasks: flatTasks,
                error: null });
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
    getTree: (tasks: TaskInstance[]) => {
      const map = new Map<string, TaskNode>();
      const roots: TaskNode[] = [];

      // Clone and clear children
      tasks?.forEach(task => {
        map.set(task.id, { ...task, children: [] });
      });

      // Build hierarchy
      tasks?.forEach(task => {
        const node = map.get(task.id)!;
        if (task.parent_id) {
          const parent = map.get(task.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      });

      return roots;
    },
    addTask: async (title: string, parentId: string | null) => {
        if (!title.trim()) return;

        try {
            const newTask: Omit<TaskNode, 'id'> = {
                template_id: null,
                parent_id: parentId,
                title: title.trim(),
                completed: false,
                sort_order: get().tasks.length,
                children: []
            };

            await storage.addTask(newTask);
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
    addTaskWithoutLoad: async (title: string, parentId: string | null = null) : Promise<string> => {
      if (!title.trim()) return '';

      try {
        const newTask: Omit<TaskInstance, 'id'> = {
          template_id: null,
          parent_id: parentId,
          title: title.trim(),
          completed: false,
          sort_order: 0,
        };

        return await storage.addTask(newTask);
        // Don't call loadTasks here
      } catch (error) {
        set({ error: (error as Error).message });
        return '';
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
    deleteTask: async (id: string) => {
        try {
            await storage.deleteTask(id);
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
    deleteAllTasks: async () => {
        try {
            const { flatTasks } = get();

            // Delete all tasks one by one
            for (const task of flatTasks) {
                await storage.deleteTask(task.id);
            }

            // Clear local state
            set({ flatTasks: [], tasks: [] });

        } catch (error) {
            console.error('Error clearing tasks:', error);
            set({ error: (error as Error).message });
            throw error;
        }
    },
    toggleTask: async (id: string) => {
        try {
            const task = get().flatTasks.find(t => t.id === id);
            if (!task) return;

            await storage.toggleTask(id, !task.completed);
            await get().recursiveUpdateChildren(id, !task.completed);
            await get().recursiveUpdateParents(id, !task.completed);
            await get().loadTasks();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
    recursiveUpdateChildren: async (id: string, completed: boolean) => {
        const subtasks = get().flatTasks.filter((task) => task.parent_id === id);
        for (const subtask of subtasks) {
            if (subtask.completed !== completed) {
                await storage.toggleTask(subtask.id, completed);
                await get().recursiveUpdateChildren(subtask.id, completed);
            }
        }
    },
    recursiveUpdateParents: async (id: string | null, completed: boolean) => {
        const task = get().flatTasks.find(t => t.id === id);
        if (!task) return;
        const parent = get().flatTasks.find((t) => t.id === task.parent_id);
        if (!parent) return;
        if (parent.completed === completed) return; // if the parent already matches the state of the current task, exit

        let updateParent = true;
        if (completed) { // to check off parent, all siblings must be checked off as well
            const siblings = await get().flatTasks.filter((t) => t.parent_id === task.parent_id);

            siblings.forEach((sibling) => {
                // If there are any siblings that do not match the updated completed state then don't change the parent
                if (sibling.id !== task.id && sibling.completed !== completed) {
                    updateParent = false;
                }
            })
        }

        if (updateParent) {
            await storage.toggleTask(parent.id, completed);
            await get().recursiveUpdateParents(task.parent_id, completed);
        }
    },
}));