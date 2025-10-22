import {AddTaskParams, TaskInstance} from '../types';
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
  addTask: async (task: AddTaskParams): Promise<string> => {
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
  },// Add to both storage files
  createTemplate: async (title: string, parentTemplateId: string | null = null): Promise<string> => {
    return await database.createTemplate(title, parentTemplateId);
  },

  getTemplateHierarchy: async (): Promise<{ templates: TaskTemplate[], relations: TaskTemplateRelation[] }> => {
    return await database.getTemplateHierarchy();
  },

  getRootTemplates: async (): Promise<TaskTemplate[]> => {
    return await database.getRootTemplates();
  },

  getTemplateChildren: async (templateId: string): Promise<TaskTemplate[]> => {
    return await database.getTemplateChildren(templateId);
  },

  createTaskFromTemplate: async (templateId: string, parentInstanceId: string | null = null): Promise<string> => {
    return await database.createTaskFromTemplate(templateId, parentInstanceId);
  },

  updateTemplate: async (templateId: string, newTitle: string, newChildren: string[]): Promise<void> => {
    await database.updateTemplate(templateId, newTitle, newChildren);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await database.deleteTemplate(id);
  },

  addTemplateRelation: async (parentTemplateId: string, childTemplateId: string, sortOrder: number = 0): Promise<void> => {
    await database.addTemplateRelation(parentTemplateId, childTemplateId, sortOrder);
  },
};

export const initStorage = async (): Promise<void> => {
  await initDatabase();
};

export const storage = nativeStorage;