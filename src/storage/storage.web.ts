import AsyncStorage from '@react-native-async-storage/async-storage';
import {AddTaskParams, TaskInstance} from '../types';

const STORAGE_KEY = '@tasks_data';

export const webStorage = {
  getTasks: async (): Promise<TaskInstance[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks =  data ? JSON.parse(data) : [];
      return tasks.sort((a: TaskInstance, b: TaskInstance) => a.sort_order - b.sort_order);
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
  addTask: async (task: AddTaskParams): Promise<string> => {
    const tasks = await webStorage.getTasks();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    console.log(`web basic add task ${task.title} under ${task.parent_id} after ${task.after_id} at ${task.sort_order}`);

    let sortOrder = task.sort_order;
    let parentId = task.parent_id;
    if (task.after_id) {
      const prevTask = tasks.find(t => t.id === task.after_id);
      if (!prevTask) {
        throw new Error('Task to insert after not found');
      }
      parentId = task.parent_id || prevTask.parent_id;
      tasks.forEach(t => {
        if (t.parent_id === parentId && t.sort_order > prevTask.sort_order) {
          t.sort_order += 1;
        }
      });
      sortOrder = prevTask.sort_order + 1;
      console.log(`web add task ${task.title} under ${prevTask.parent_id} after ${prevTask.title} at ${sortOrder}`);
    } else if (sortOrder === undefined) {
      const siblings = tasks.filter(t=>t.parent_id === parentId);
      sortOrder = siblings.length;
    }
    console.log(`web create task ${id}, ${task.title}, ${parentId}, ${sortOrder}`);
    const newTask: TaskInstance = {
      id,
      title: task.title,
      parent_id: parentId,
      template_id: task.template_id || null,
      completed: task.completed ? 1 : 0,
      sort_order: sortOrder,
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