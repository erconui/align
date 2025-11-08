import { database, initDatabase } from '../database/database';
import { AddTaskParams, AddTemplateParams, TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';

const nativeStorage = {
  getRootTasks: async (): Promise<TaskInstance[]> => {
    try {
      let tasks = await database.getRootTasks();
      tasks = tasks.map(task => ({
        ...task,
        completed: Boolean(task.completed) // or task.completed === 1
      }));
      return tasks;
    } catch (error) {
      console.error('Error getting tasks from SQLite:', error);
      return [];
    }
  },
  getTasks: async (): Promise<TaskInstance[]> => {
    try {
      let tasks = await database.getAllTasks();
      tasks = tasks.map(task => ({
        ...task,
        completed: Boolean(task.completed) // or task.completed === 1
      }));
      return tasks;
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
  createTemplate: async (template: AddTemplateParams): Promise<string> => {
    return await database.createTemplate(template);
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
  removeTemplate: async (parentId: string | null, id: string): Promise<void> => {
      await database.removeTemplate(parentId, id);
  },

  addTemplateRelation: async (parentTemplateId: string, childTemplateId: string, position: number = 0): Promise<void> => {
    await database.addTemplateRelation(parentTemplateId, childTemplateId, position);
  },
  replaceTemplate: async (parentId: string, oldId: string, newId: string): Promise<void> => {
    try {
      await database.replaceTemplate(parentId, oldId, newId);
    } catch (error) {
      console.error('Error replacing template relation', error);
      throw error;
    }
  },
  replaceTaskWithTemplate: async (taskId: string, templateId: string): Promise<void> => {
    try {
      await database.replaceTaskWithTemplate(taskId, templateId);
    } catch (error) {
      console.error('Error replacing task with template', error);
      throw error;
    }
  },
  clearDatabase: async (): Promise<void> => {
    try {
      await database.clearDatabase();
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
};

export const initStorage = async (): Promise<void> => {
  await initDatabase();
};

export const storage = nativeStorage;