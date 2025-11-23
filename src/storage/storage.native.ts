import { database, initDatabase } from '../database/database';
import { AddTaskParams, AddTemplateParams, TaskInstance, TaskParams, TaskTemplate, TaskTemplateRelation } from '../types';

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
        completed: Boolean(task.completed), // or task.completed === 1
        private: Boolean(task.private)
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
  },
  updateTask: async (task: TaskParams): Promise<void> => {
    await database.updateTask(task);
  },
  moveTask: async (id: string, targetId: string, levelsOffset: number): Promise<void> => {
    try {
      await database.moveTask(id, targetId, levelsOffset);
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  },
  createTemplate: async (template: AddTemplateParams): Promise<string> => {
    return await database.createTemplate(template);
  },

  getTemplateHierarchy: async (): Promise<{ templates: TaskTemplate[], relations: TaskTemplateRelation[] }> => {
    const hierarchy = await database.getTemplateHierarchy();
    return {
      templates: hierarchy.templates,
      relations: hierarchy.relations.map(rel => ({ ...rel, expanded: Boolean(rel.expanded) }))
    };
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

  createTemplateFromTask: async (taskId: string, parentInstanceId: string | null = null): Promise<string> => {
    return await database.createTemplateFromTask(taskId, parentInstanceId);
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
  },
  toggleTaskExpand: async (id: string): Promise<void> => {
    try {
      await database.toggleTaskExpand(id);
    } catch (error) {
      console.error('Error toggling the task', error);
      throw error;
    }
  },
  toggleTemplateExpand: async (parentId: string | null, id: string): Promise<void> => {
    try {
      await database.toggleTemplateExpand(parentId, id);
    } catch (error) {
      console.error('Error toggling the task', error);
      throw error;
    }
  },
  moveTemplate: async (id: string, targetId: string, levelsOffset: number): Promise<void> => {
    try {
      await database.moveTemplate(id, targetId, levelsOffset);
    } catch (error) {
      console.error('Error moving template:', error);
      throw error;
    }
  },
  saveTasks: async (tasks: TaskInstance[]) => {
    try {
      await database.saveTasks(tasks);
    } catch (error) {
      console.error('Error saving tasks', error);
      throw error;
    }
  },
  saveTemplates: async (templates: TaskTemplate[]) => {
    try {
      await database.saveTemplates(templates);
    } catch (error) {
      console.error('Error saving tasks', error);
      throw error;
    }
  },
  saveRelations: async (relations: TaskTemplateRelation[]) => {
    try {
      await database.saveRelations(relations);
    } catch (error) {
      console.error('Error saving tasks', error);
      throw error;
    }
  },
};

export const initStorage = async (): Promise<void> => {
  await initDatabase();
};

export const storage = nativeStorage;